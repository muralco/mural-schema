Feature: from TS

Scenario: Custom Type
  Given a TS file with
    """
    type Email = string;
    type X = { a: Email };
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["Email"]
    }
    """
  Then the generated schema is
    """
    export const X = {
      a: 'Email',
    };
    """

Scenario: Custom Type transform (lowercase)
  Given a TS file with
    """
    type Email = string;
    type X = Email;
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["Email"],
      "customTypeTransform": "lowercase"
    }
    """
  Then the generated schema is
    """
    export const X = 'email';
    """

Scenario: Custom Type transform (camelCase)
  Given a TS file with
    """
    type AddressAndZipCode = string;
    type X = AddressAndZipCode;
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["AddressAndZipCode"],
      "customTypeTransform": "camelCase"
    }
    """
  Then the generated schema is
    """
    export const X = 'addressAndZipCode';
    """

Scenario: Custom Type transform (snake-case)
  Given a TS file with
    """
    type AddressAndZipCode = string;
    type X = AddressAndZipCode;
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["AddressAndZipCode"],
      "customTypeTransform": "snake-case"
    }
    """
  Then the generated schema is
    """
    export const X = 'address-and-zip-code';
    """
