Feature: object

Scenario: success number
  Given a schema { "key": "number" }
  When validating { "key": 1 }
  Then the validation passes

Scenario: success one of each
  Given a schema
    """
    {
      "a": ["number"],
      "b": "boolean",
      "n": "number",
      "o": { "child": "string" },
      "s": "string"
    }
    """
  When validating
    """
    {
      "a": [1],
      "b": true,
      "n": 1,
      "o": { "child": "yeah" },
      "s": "name"
    }
    """
  Then the validation passes

Scenario: success not-strict
  Given a schema { "key": "number", "$strict": false }
  When validating { "key": 1, "extra": 2 }
  Then the validation passes

Scenario: error extra keys (strict mode)
  Given a schema { "key": "number" }
  When validating { "key": 1, "extra": 2 }
  Then the validation error is "Unexpected key" at [body.extra]

Scenario: error missing keys
  Given a schema { "key": "number" }
  When validating {}
  Then the validation error is "Expected number" at [body.key]

Scenario: error nested
  Given a schema { "key": { "n": "number" } }
  When validating { "key": { "n": true } }
  Then the validation error is "Expected number" at [body.key.n]

Scenario: success optional key not present
  Given a schema { "key?": "number" }
  When validating {}
  Then the validation passes

Scenario: success optional key present
  Given a schema { "key?": "number" }
  When validating { "key": 1 }
  Then the validation passes

Scenario: success optional key wrong type
  Given a schema { "key?": "number" }
  When validating { "key": "one" }
  Then the validation error is "Expected number, undefined" at [body.key]
