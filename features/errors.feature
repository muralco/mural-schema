Feature: schema compilation errors

Background:
  Given variable ERROR is "Partial key modifiers can only be used with object, object array and object union values."

Scenario: invalid type literal
  When compiling the invalid schema { "key": "InvalidType" }
  Then the compilation error at message is
    """
    "Unknown type for `key`: InvalidType"
    """

Scenario: invalid partial modifier for non-object
  When compiling the invalid schema { "key/": "string" }
  Then the compilation error at message contains ${ERROR}

Scenario: invalid partial modifier for non-object array
  When compiling the invalid schema { "key/": ["string"] }
  Then the compilation error at message contains ${ERROR}

Scenario: invalid partial modifier for non-object union
  When compiling the invalid schema { "key/": [["string"]] }
  Then the compilation error at message contains ${ERROR}

Scenario: invalid partial modifier for mixed non-object array
  When compiling the invalid schema { "key/": [{ "a": "string" }, "boolean"] }
  Then the compilation error at message contains ${ERROR}

Scenario: invalid partial modifier for mixed non-object union
  When compiling the invalid schema { "key/": [[{ "a": "string" }, "boolean"]] }
  Then the compilation error at message contains ${ERROR}
