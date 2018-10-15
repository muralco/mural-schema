Feature: custom

Scenario: success email
  Given a schema "email"
  When validating "email@domain.com"
  Then the validation passes

Scenario: error email
  Given a schema "email"
  When validating "not an email"
  Then the validation error is "Expected email"

Scenario: success Person
  Given a schema "Person"
  When validating { "first": "Peter", "last": "Griffin" }
  Then the validation passes

Scenario: success Person?
  Given a schema "Person?"
  When validating undefined
  Then the validation passes


Scenario: error Person
  Given a schema "Person"
  When validating { "first": "Peter" }
  Then the validation error is "Expected string" at ["last"]
