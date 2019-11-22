// Copyright 2019 Diffblue Limited. All Rights Reserved.

import { isFunction, isPlainObject } from 'lodash';

import { FilterResultsError, FilterResultsErrorCode } from './errors';
import {
  AnalysisResult,
  ResultsFilter,
  ResultTagFilterObject,
} from './types/types';


/**
 * Filter an array of AnalysisResults by tag
 *
 * Results which match at least one include tag (if any are specified)
 * and none of the exclude tags (if any are specified)
 * are returned.
 */
function filterResultsByTag(
  results: AnalysisResult[],
  filter: ResultTagFilterObject,
): AnalysisResult[] {
  return results.filter((result) => {
    if (
      filter.include &&
      filter.include.length &&
      !filter.include.some((tag) => result.tags.includes(tag))
    ) {
      return false;
    }
    if (
      filter.exclude &&
      filter.exclude.length &&
      filter.exclude.some((tag) => result.tags.includes(tag))
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Filter an array of AnalysisResults
 *
 * The filter may be an array of tag strings,
 * in which case results with at least one matching tag are returned.
 *
 * The filter may be an object with optional `include` and `exclude`
 * properties, containing arrays of tag strings.
 * Results which match at least one include tag (if any are specified)
 * and none of the exclude tags (if any are specified)
 * are returned.
 *
 * The filter may be a callback function that accepts an `AnalysisResult` object
 * and returns a boolean, in which case this callback is used to filter the results array directly.
 *
 * If no filter is supplied the results array is retuned unaltered.
 */
export default function filterResults(
  results: AnalysisResult[],
  filter?: ResultsFilter,
): AnalysisResult[] {
  let filteredResults = results;
  if (filter) {
    try {
      if (Array.isArray(filter)) {
        filteredResults = filterResultsByTag(results, { include: filter });
      } else if (isFunction(filter)) {
        filteredResults = results.filter(filter);
      } else if (isPlainObject(filter)) {
        filteredResults = filterResultsByTag(results, filter);
      } else {
        throw new FilterResultsError(
          'Results filter must be an an array, object or function',
          FilterResultsErrorCode.FILTER_INVALID,
        );
      }
    } catch (error) {
      if (error instanceof FilterResultsError) {
        throw error;
      } else {
        throw new FilterResultsError(
          `Filtering results failed: ${error.message}`,
          FilterResultsErrorCode.FILTER_FAILED,
        );
      }
    }
  }
  return filteredResults;
}
