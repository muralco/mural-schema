Feature: boolean

Background:
  Given a schema "boolean"

Scenario: success true
  When validating true
  Then the validation passes

Scenario: success false
  When validating true
  Then the validation passes

Scenario: error number
  When validating 1
  Then the validation error is "Expected boolean"

Scenario: error string
  When validating "yeah"
  Then the validation error is "Expected boolean"

Scenario: error object
  When validating { "a": 1 }
  Then the validation error is "Expected boolean"

Scenario: error array
  When validating []
  Then the validation error is "Expected boolean"
