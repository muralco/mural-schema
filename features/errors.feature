Feature: schema compilation errors

Scenario: invalid type literal
  When compiling the invalid schema { "key": "InvalidType" }
  Then the compilation error at message is
    """
    "Unknown type for `key`: InvalidType"
    """

Scenario: invalid partial modifier for non-object
  When compiling the invalid schema { "key/": "string" }
  Then the compilation error at message contains
    """
    "Partial key modifiers can only be used with object values."
    """
