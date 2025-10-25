/**
 * Validation script to ensure each value has exactly 10 aligned and 10 unaligned brands
 *
 * Run with: npm run validate-value-data
 */

import dotenv from 'dotenv';
dotenv.config();

import { fetchBrandsFromSheets, fetchCausesFromSheets } from '../backend/services/google-sheets';
import { Brand, ValueItem } from '../types';

interface ValidationResult {
  valueId: string;
  valueName: string;
  alignedCount: number;
  unalignedCount: number;
  alignedPositions: number[];
  unalignedPositions: number[];
  errors: string[];
  warnings: string[];
}

async function validateValueCoverage() {
  console.log('\n🔍 Validating Value Coverage (10+10 Rule)\n');
  console.log('='.repeat(60));

  try {
    // Fetch data from Google Sheets
    console.log('\n📊 Fetching data from Google Sheets...');
    const [brands, causes] = await Promise.all([
      fetchBrandsFromSheets(),
      fetchCausesFromSheets(),
    ]);

    console.log(`✅ Fetched ${brands.length} brands`);
    console.log(`✅ Fetched ${causes.length} values/causes`);

    // Build value coverage map
    const valueCoverage = new Map<string, {
      aligned: { brandId: string; position: number }[];
      unaligned: { brandId: string; position: number }[];
    }>();

    // Initialize map for all values
    causes.forEach(cause => {
      valueCoverage.set(cause.id, {
        aligned: [],
        unaligned: [],
      });
    });

    // Populate coverage from brands
    brands.forEach(brand => {
      brand.valueAlignments.forEach(alignment => {
        const coverage = valueCoverage.get(alignment.valueId);
        if (!coverage) {
          // Value exists in brand but not in Causes sheet
          return;
        }

        if (alignment.isSupport) {
          coverage.aligned.push({ brandId: brand.id, position: alignment.position });
        } else {
          coverage.unaligned.push({ brandId: brand.id, position: alignment.position });
        }
      });
    });

    // Validate each value
    const results: ValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let perfectCount = 0;

    for (const cause of causes) {
      const coverage = valueCoverage.get(cause.id)!;
      const errors: string[] = [];
      const warnings: string[] = [];

      const alignedPositions = coverage.aligned.map(a => a.position).sort((a, b) => a - b);
      const unalignedPositions = coverage.unaligned.map(a => a.position).sort((a, b) => a - b);

      // Check aligned count
      if (coverage.aligned.length < 10) {
        errors.push(`Only ${coverage.aligned.length}/10 aligned brands`);
      } else if (coverage.aligned.length > 10) {
        errors.push(`Too many aligned brands: ${coverage.aligned.length}/10`);
      }

      // Check unaligned count
      if (coverage.unaligned.length < 10) {
        errors.push(`Only ${coverage.unaligned.length}/10 unaligned brands`);
      } else if (coverage.unaligned.length > 10) {
        errors.push(`Too many unaligned brands: ${coverage.unaligned.length}/10`);
      }

      // Check aligned positions (should be 1-10, no duplicates)
      if (coverage.aligned.length === 10) {
        const expectedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const positionSet = new Set(alignedPositions);

        if (positionSet.size !== 10) {
          errors.push('Duplicate positions in aligned brands');
        }

        const missingPositions = expectedPositions.filter(p => !positionSet.has(p));
        if (missingPositions.length > 0) {
          warnings.push(`Missing aligned positions: ${missingPositions.join(', ')}`);
        }

        const invalidPositions = alignedPositions.filter(p => p < 1 || p > 10);
        if (invalidPositions.length > 0) {
          errors.push(`Invalid aligned positions: ${invalidPositions.join(', ')}`);
        }
      }

      // Check unaligned positions (should be 1-10, no duplicates)
      if (coverage.unaligned.length === 10) {
        const expectedPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const positionSet = new Set(unalignedPositions);

        if (positionSet.size !== 10) {
          errors.push('Duplicate positions in unaligned brands');
        }

        const missingPositions = expectedPositions.filter(p => !positionSet.has(p));
        if (missingPositions.length > 0) {
          warnings.push(`Missing unaligned positions: ${missingPositions.join(', ')}`);
        }

        const invalidPositions = unalignedPositions.filter(p => p < 1 || p > 10);
        if (invalidPositions.length > 0) {
          errors.push(`Invalid unaligned positions: ${invalidPositions.join(', ')}`);
        }
      }

      // Check if perfect
      const isPerfect =
        coverage.aligned.length === 10 &&
        coverage.unaligned.length === 10 &&
        errors.length === 0 &&
        warnings.length === 0;

      if (isPerfect) {
        perfectCount++;
      }

      totalErrors += errors.length;
      totalWarnings += warnings.length;

      results.push({
        valueId: cause.id,
        valueName: cause.name,
        alignedCount: coverage.aligned.length,
        unalignedCount: coverage.unaligned.length,
        alignedPositions,
        unalignedPositions,
        errors,
        warnings,
      });
    }

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));

    // Summary
    console.log(`\n✅ Perfect values: ${perfectCount}/${causes.length}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`⚠️  Total warnings: ${totalWarnings}`);

    // Show perfect values
    if (perfectCount > 0) {
      console.log('\n✅ PERFECT VALUES (10 aligned + 10 unaligned):');
      console.log('-'.repeat(60));
      results
        .filter(r => r.errors.length === 0 && r.warnings.length === 0 && r.alignedCount === 10 && r.unalignedCount === 10)
        .forEach(r => {
          console.log(`  ✓ ${r.valueName.padEnd(30)} (${r.valueId})`);
        });
    }

    // Show problems
    const problemResults = results.filter(r => r.errors.length > 0 || r.warnings.length > 0 || r.alignedCount !== 10 || r.unalignedCount !== 10);

    if (problemResults.length > 0) {
      console.log(`\n⚠️  VALUES WITH ISSUES (${problemResults.length}/${causes.length}):`);
      console.log('-'.repeat(60));

      problemResults.forEach(r => {
        const status = r.errors.length > 0 ? '❌' : '⚠️ ';
        console.log(`\n${status} ${r.valueName} (${r.valueId})`);
        console.log(`   Aligned: ${r.alignedCount}/10 ${r.alignedPositions.length > 0 ? `[${r.alignedPositions.join(', ')}]` : '[none]'}`);
        console.log(`   Unaligned: ${r.unalignedCount}/10 ${r.unalignedPositions.length > 0 ? `[${r.unalignedPositions.join(', ')}]` : '[none]'}`);

        if (r.errors.length > 0) {
          r.errors.forEach(err => console.log(`   ❌ ${err}`));
        }
        if (r.warnings.length > 0) {
          r.warnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
        }
      });
    }

    // Show values with no coverage
    const noCoverage = results.filter(r => r.alignedCount === 0 && r.unalignedCount === 0);
    if (noCoverage.length > 0) {
      console.log(`\n🚨 VALUES WITH NO BRANDS (${noCoverage.length}):`);
      console.log('-'.repeat(60));
      noCoverage.forEach(r => {
        console.log(`  • ${r.valueName} (${r.valueId})`);
      });
    }

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (perfectCount === causes.length) {
      console.log('🎉 ALL VALUES PASS! Data is ready for production.');
    } else {
      console.log(`📋 NEXT STEPS: Fix ${causes.length - perfectCount} values with issues.`);
    }
    console.log('='.repeat(60) + '\n');

    // Exit with error code if there are errors
    process.exit(totalErrors > 0 ? 1 : 0);

  } catch (error: any) {
    console.error('\n❌ Error during validation:', error.message);
    process.exit(1);
  }
}

// Run validation
validateValueCoverage();
