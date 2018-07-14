Feature: any

Background:
  Given a schema "any"

Scenario: string
  When validating "yeah!"
  Then the validation passes

Scenario: boolean
  When validating true
  Then the validation passes

Scenario: number
  When validating 1
  Then the validation passes

Scenario: object
  When validating { "a": 1 }
  Then the validation passes

Scenario: array
  When validating []
  Then the validation passes
