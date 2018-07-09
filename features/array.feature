Feature: array

Scenario: success number
  Given a schema ["number"]
  When validating [1, 2, 3]
  Then the validation passes

Scenario: success number, string or object
  Given a schema ["number", "string", { "a": "boolean" }]
  When validating [1, "two", 3, { "a": true }]
  Then the validation passes

Scenario: error invalid type
  Given a schema ["number"]
  When validating 1
  Then the validation error is "Expected array"

Scenario: error invalid array type
  Given a schema ["number"]
  When validating [0, true]
  Then the validation error is "Expected number" at [body.1]

Scenario: error invalid array object type
  Given a schema [{ "a": "string" }]
  When validating [{ "a": 123 }]
  Then the validation error is "Expected string" at [body.0.a]
