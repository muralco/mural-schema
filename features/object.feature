Feature: object

Scenario: success null
  Given a schema { "key": null }
  When validating { "key": null }
  Then the validation passes

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
      "lu": "'a'|'b'",
      "n": "number",
      "o": { "child": "string" },
      "s": "string",
      "u": null
    }
    """
  When validating
    """
    {
      "a": [1],
      "b": true,
      "lu": "a",
      "n": 1,
      "o": { "child": "yeah" },
      "s": "name",
      "u": null
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
  Then the validation error is "Unexpected key" at ["extra"]

Scenario: error missing keys
  Given a schema { "key": "number" }
  When validating {}
  Then the validation error is "Expected number" at ["key"]

Scenario: error nested
  Given a schema { "key": { "n": "number" } }
  When validating { "key": { "n": true } }
  Then the validation error is "Expected number" at ["key", "n"]

# === Optional =============================================================== #

Scenario: success optional key not present
  Given a schema { "key?": "number" }
  When validating {}
  Then the validation passes

Scenario: success optional key present
  Given a schema { "key?": "number" }
  When validating { "key": 1 }
  Then the validation passes

Scenario: error optional key wrong type
  Given a schema { "key?": "number" }
  When validating { "key": "one" }
  Then the validation error is "Expected number, undefined" at ["key"]

# === Partial ================================================================ #

Scenario: success partial key present
  Given a schema { "key/": { "a": "string", "b": "string" } }
  When validating { "key": { "a": "hey" } }
  Then the validation passes

Scenario: success partial empty
  Given a schema { "key/": { "a": "string", "b": "string" } }
  When validating { "key": {} }
  Then the validation passes

Scenario: error partial key wrong type
  Given a schema { "key/": { "a": "string", "b": "string" } }
  When validating { "key": { "a": 1 } }
  Then the validation error is "Expected string, undefined" at ["key", "a"]

# === Recursive partial ====================================================== #

Scenario: success recursive partial key present
  Given a schema
    """
    {
      "key//": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating { "key": { "a": { "b": "hey"} } }
  Then the validation passes

Scenario: success recursive partial empty
  Given a schema
    """
    {
      "key//": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating { "key": {} }
  Then the validation passes

Scenario: error recursive partial key wrong type
  Given a schema
    """
    {
      "key//": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating { "key": { "a": { "b": 1 } } }
  Then the validation error is "Expected string, undefined" at ["key", "a", "b"]

# === Partial Array ========================================================== #

Scenario: success partial array key present
  Given a schema { "key/": [{ "a": "string" }] }
  When validating { "key": [{ "a": "hey" }] }
  Then the validation passes

Scenario: success partial array empty array
  Given a schema { "key/": [{ "a": "string" }] }
  When validating { "key": [] }
  Then the validation passes

Scenario: success partial array empty object
  Given a schema { "key/": [{ "a": "string" }] }
  When validating { "key": [{}] }
  Then the validation passes

Scenario: error partial key wrong type
  Given a schema { "key/": [{ "a": "string" }] }
  When validating { "key": [{ "a": 1 }] }
  Then the validation error is "Expected string, undefined" at ["key", 0, "a"]

# === Partial Union ========================================================== #

Scenario: success partial union first present
  Given a schema { "key/": [[{ "a": "string" },{ "b": "string"}]] }
  When validating { "key": { "a": "hey" } }
  Then the validation passes

Scenario: success partial union second present
  Given a schema { "key/": [[{ "a": "string" },{ "b": "string"}]] }
  When validating { "key": { "b": "hey" } }
  Then the validation passes

Scenario: success partial union empty
  Given a schema { "key/": [[{ "a": "string" },{ "b": "string"}]] }
  When validating { "key": {} }
  Then the validation passes

Scenario: error partial union invalid key
  Given a schema { "key/": [[{ "a": "string" },{ "b": "string"}]] }
  When validating { "key": { "c": 1 } }
  Then the validation error is "Unexpected key" at ["key", "c"]

Scenario: error partial union wrong type
  Given a schema { "key/": [[{ "a": "string" },{ "b": "string"}]] }
  When validating { "key": { "a": 1 } }
  Then the validation error is "Expected string, undefined" at ["key", "a"]

# === Optional partial ======================================================= #

Scenario: success partial optional key present
  Given a schema { "key/?": { "a": "string", "b": "string" } }
  When validating { "key": { "a": "hey" } }
  Then the validation passes

Scenario: success partial optional key empty
  Given a schema { "key/?": { "a": "string", "b": "string" } }
  When validating { "key": {} }
  Then the validation passes

Scenario: success partial optional empty
  Given a schema { "key/?": { "a": "string", "b": "string" } }
  When validating {}
  Then the validation passes

Scenario: error partial optional key wrong type
  Given a schema { "key/?": { "a": "string", "b": "string" } }
  When validating { "key": { "a": 1 } }
  Then the validation error is "Expected string, undefined" at ["key", "a"]

# === Optional recursive partial ============================================= #

Scenario: success optional recursive partial key present
  Given a schema
    """
    {
      "key//?": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating { "key": { "a": { "b": "hey"} } }
  Then the validation passes

Scenario: success optional recursive partial empty key
  Given a schema
    """
    {
      "key//?": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating { "key": {} }
  Then the validation passes

Scenario: success optional recursive partial empty
  Given a schema
    """
    {
      "key//?": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating {}
  Then the validation passes

Scenario: error optional recursive partial key wrong type
  Given a schema
    """
    {
      "key//?": {
        "a": {
          "b": "string",
          "c": "string"
        },
        "d": "string"
      }
    }
    """
  When validating { "key": { "a": { "b": 1 } } }
  Then the validation error is "Expected string, undefined" at ["key", "a", "b"]

Scenario: error optional partial invalid modifier order
  Given a schema { "key?/": { "a": "string" } }
  # Note that the suffix above is wrong, it should be `/?`!
  When validating {}
  Then the validation error is "Expected object" at ["key?"]

# === Keyof ================================================================== #

Scenario: success keyof key present
  Given a schema { "key:keyof": { "a": "string", "b": "string" } }
  When validating { "key": "a" }
  Then the validation passes

Scenario: error keyof key wrong value
  Given a schema { "key:keyof": { "a": "string", "b": "string" } }
  When validating { "key": "c" }
  Then the validation error is "Expected 'a', 'b'" at ["key"]

Scenario: error keyof key wrong type
  Given a schema { "key:keyof": { "a": "string", "b": "string" } }
  When validating { "key": 1 }
  Then the validation error is "Expected 'a', 'b'" at ["key"]

# === $keyof ================================================================= #

Scenario: success $keyof key present
  Given a schema { "$keyof": { "a": "string", "b": "string" } }
  When validating "a"
  Then the validation passes

Scenario: error $keyof key wrong value
  Given a schema { "$keyof": { "a": "string", "b": "string" } }
  When validating "c"
  Then the validation error is "Expected 'a', 'b'"

Scenario: error keyof key wrong type
  Given a schema { "$keyof": { "a": "string", "b": "string" } }
  When validating 1
  Then the validation error is "Expected 'a', 'b'"

Scenario: success $keyof array key present
  Given a schema [{ "$keyof": { "a": "string", "b": "string" } }]
  When validating ["a"]
  Then the validation passes

Scenario: success $keyof array empty
  Given a schema [{ "$keyof": { "a": "string", "b": "string" } }]
  When validating []
  Then the validation passes

Scenario: error $keyof key wrong value
  Given a schema [{ "$keyof": { "a": "string", "b": "string" } }]
  When validating ["c"]
  Then the validation error is "Expected 'a', 'b'" at [0]

Scenario: error keyof key wrong type
  Given a schema [{ "$keyof": { "a": "string", "b": "string" } }]
  When validating "a"
  Then the validation error is "Expected array"

# === $any =================================================================== #

Scenario: success $any
  Given a schema { "$any": "string" }
  When validating { "a": "message" }
  Then the validation passes

Scenario: success $any (empty)
  Given a schema { "$any": "string" }
  When validating {}
  Then the validation passes

Scenario: error $any
  Given a schema { "$any": "string" }
  When validating { "a": 1 }
  Then the validation error is "Expected string" at ["a"]

Scenario: success nested $any
  Given a schema { "$any": { "a": "string" } }
  When validating { "x": { "a": "message" } }
  Then the validation passes

Scenario: success nested $any (empty)
  Given a schema { "$any": { "a": "string" } }
  When validating {}
  Then the validation passes

Scenario: success partial nested $any
  Given a schema { "$any/": { "a": "string", "b": "string" } }
  When validating { "id": { "a": "some" } }
  Then the validation passes

Scenario: success recursive partial nested $any
  Given a schema { "$any//": { "a": { "b": "string", "c": "string" }, "d": "string" } }
  When validating { "id": { "a": { "b": "some" } } }
  Then the validation passes

Scenario: error nested $any
  Given a schema { "$any": { "a": "string" } }
  When validating { "x": { "a": 1 } }
  Then the validation error is "Expected string" at ["x", "a"]

Scenario: error partial nested $any
  Given a schema { "$any/": { "a": "string", "b": "string" } }
  When validating { "id": { "c": "some" } }
  Then the validation error is "Unexpected key" at ["id", "c"]
