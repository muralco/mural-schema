Feature: string?

Background:
  Given a schema "string?"

Scenario: success
  When validating "yeah!"
  Then the validation passes

Scenario: success (not present)
  When validating undefined
  Then the validation passes

Scenario: error boolean
  When validating true
  Then the validation error is "Expected string, undefined"

Scenario: error number
  When validating 1
  Then the validation error is "Expected string, undefined"

Scenario: error object
  When validating { "a": 1 }
  Then the validation error is "Expected string, undefined"

Scenario: error array
  When validating []
  Then the validation error is "Expected string, undefined"
