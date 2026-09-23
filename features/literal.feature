Feature: literal

Scenario: success hashed string
  Given a schema "#good"
  When validating "good"
  Then the validation passes

Scenario: error string
  Given a schema "#good"
  When validating "bad"
  Then the validation error is "Expected 'good'. Received string"

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
  Then the validation error is "Expected true. Received boolean"

Scenario: success number
  Given a schema 1
  When validating 1
  Then the validation passes

Scenario: error number
  Given a schema 1
  When validating 2
  Then the validation error is "Expected 1. Received number"

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
  Then the validation error is "Expected 'good', 'ok'. Received string"

Scenario: success string union single quote
  Given a schema "'very good'|'very bad'"
  When validating "very good"
  Then the validation passes

Scenario: error string union single quote
  Given a schema "'very good'|'very bad'"
  When validating "very mild"
  Then the validation error is "Expected 'very good', 'very bad'. Received string"

Scenario: success string union numbers
  Given a schema "1|2"
  When validating 1
  Then the validation passes

Scenario: error string union numbers (invalid type)
  Given a schema "1|2"
  When validating "1"
  Then the validation error is "Expected 1, 2. Received string"

Scenario: error string union numbers (invalid value)
  Given a schema "1|2"
  When validating 3
  Then the validation error is "Expected 1, 2. Received number"

Scenario: success string boolean
  Given a schema "true"
  When validating true
  Then the validation passes

Scenario: error string boolean (invalid type)
  Given a schema "true"
  When validating "true"
  Then the validation error is "Expected true. Received string"

Scenario: error string boolean (invalid value)
  Given a schema "true"
  When validating false
  Then the validation error is "Expected true. Received boolean"

Scenario: success string null
  Given a schema "null"
  When validating null
  Then the validation passes

Scenario: error string null (invalid type)
  Given a schema "null"
  When validating "null"
  Then the validation error is "Expected null. Received string"

Scenario: error string null (invalid value)
  Given a schema "null"
  When validating 1
  Then the validation error is "Expected null. Received number"

Scenario: success string undefined
  Given a schema "undefined"
  When validating undefined
  Then the validation passes

Scenario: error string null (invalid type)
  Given a schema "undefined"
  When validating "undefined"
  Then the validation error is "Expected undefined. Received string"

Scenario: error string undefined (invalid value)
  Given a schema "undefined"
  When validating 1
  Then the validation error is "Expected undefined. Received number"
