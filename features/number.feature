Feature: number

Background:
  Given a schema "number"

Scenario: success
  When validating 1
  Then the validation passes

Scenario: error boolean
  When validating true
  Then the validation error is "Expected number"

Scenario: error string
  When validating "yeah"
  Then the validation error is "Expected number"

Scenario: error object
  When validating { "a": 1 }
  Then the validation error is "Expected number"

Scenario: error array
  When validating []
  Then the validation error is "Expected number"
