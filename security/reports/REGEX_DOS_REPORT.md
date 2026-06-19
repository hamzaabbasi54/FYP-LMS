# REGEX_DOS Security Report

## Status: PASS

## Findings

### Regular Expressions
A search across the backend for regular expressions revealed the following custom patterns:
1. Email validation: `/^\S+@\S+\.\S+$/` (in `authController.js`)
2. CLO ID validation: `/^CLO-\d+$/` (in `courseRoutes.js`)
3. CLO ID extraction: `/^CLO-(\d+)$/i` (in `courseRoutes.js`)

None of these expressions use nested quantifiers (like `(a+)+`) or overlapping alternations with repetitions. They are strictly bound and process simple strings without backtracking.

## What's at risk

Nothing. ReDoS (Regular Expression Denial of Service) occurs when an attacker provides a string that causes a poorly written regular expression to take exponential time to evaluate, blocking the Node.js event loop. Since all regexes in this application evaluate in linear or near-linear time, this attack is not possible.

## What's already secure

- Simple, well-defined regular expressions are used.
- No complex nested grouping or unbounded wildcards (`.*.*`).

## Recommendations

No changes needed.
