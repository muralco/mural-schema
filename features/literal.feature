Feature: literal

Scenario: success hashed string
  Given a schema "#good"
  When validating "good"
  Then the validation passes

Scenario: error string
  Given a schema "#good"
  When validating "bad"
  Then the validation error is "Expected 'good'"

Scenario: success single-quoted string
  Given a schema "'good'"
  When validating "good"
  Then the validation passes

Scenario: success double-quoted string
  Given a schema "\"good\""
  When validating "good"
  Then the validation passes

Scenario: success boolean
  Given a schema true
  When validating true
  Then the validation passes

Scenario: error string
  Given a schema true
  When validating false
  Then the validation error is "Expected true"

Scenario: success number
  Given a schema 1
  When validating 1
  Then the validation passes

Scenario: error number
  Given a schema 1
  When validating 2
  Then the validation error is "Expected 1"

Scenario: success string union 1
  Given a schema "#good|#ok"
  When validating "good"
  Then the validation passes

Scenario: success string union 2
  Given a schema "#good|#ok"
  When validating "ok"
  Then the validation passes

Scenario: error string union
  Given a schema "#good|#ok"
  When validating "bad"
  Then the validation error is "Expected 'good', 'ok'"

Scenario: success string union single quote
  Given a schema "'very good'|'very bad'"
  When validating "very good"
  Then the validation passes

Scenario: error string union single quote
  Given a schema "'very good'|'very bad'"
  When validating "very mild"
  Then the validation error is "Expected 'very good', 'very bad'"
