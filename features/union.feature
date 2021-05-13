Feature: union

Scenario: success object
  Given a schema [[{"n": "number"}, "number"]]
  When validating { "n": 1 }
  Then the validation passes

Scenario: success number
  Given a schema [[{"n": "number"}, "number"]]
  When validating 1
  Then the validation passes

Scenario: success optional
  Given a schema [[{"n": "number"}, null]]
  When validating null
  Then the validation passes

Scenario: success optional array
  Given a schema [[["number"], null]]
  When validating [1]
  Then the validation passes

Scenario: success optional array
  Given a schema [[["number"], null]]
  When validating null
  Then the validation passes

Scenario: error no matching type
  Given a schema [[{"n": "number"}, "number"]]
  When validating true
  Then the validation error is "Expected object, number"

Scenario: error matching type with errors
  Given a schema [[{"n": "number"}, "number"]]
  When validating { "n": true }
  Then the validation error is "Expected number" at ["n"]

Scenario: success string
  Given a schema "number|string"
  When validating 1
  Then the validation passes

Scenario: success string
  Given a schema "number|string"
  When validating "one"
  Then the validation passes

Scenario: error string no matching type
  Given a schema "number|string"
  When validating true
  Then the validation error is "Expected number, string"

Scenario: success string and null union against string
  Given a schema "string|null"
  When validating "good"
  Then the validation passes

Scenario: success string and null union against null
  Given a schema "string|null"
  When validating null
  Then the validation passes

Scenario: error string and null union
  Given a schema "string|null"
  When validating 1
  Then the validation error is "Expected string, null"

Scenario: return errors from best match
  Given a schema [[{"a": "number", "b": "number"}, {"a": "string", "c": "number"}]]
  When validating { "a": "hi" }
  Then the validation error is "Expected number" at ["c"]
