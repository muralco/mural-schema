Feature: regexp

Background:
  Given a schema /^\d+$/

Scenario: success
  When validating "123"
  Then the validation passes

Scenario: error invalid type
  When validating true
  Then the validation error is "Expected string"

Scenario: error invalid valud
  When validating "a"
  Then the validation error is "Value does not match: /^\d+$/"
