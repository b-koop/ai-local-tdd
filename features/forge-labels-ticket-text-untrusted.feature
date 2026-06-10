Feature: Forge labels ticket lookup text as untrusted

  Ticket bodies fetched from external systems can contain prompt-injection
  attempts. Forge must mark that text as untrusted data before any agent
  reads it.

  Scenario: /forge labels ticket lookup text as untrusted before agents read it
    Given a ticket whose body contains instructions aimed at the agent
    When /forge fetches the ticket text from external lookup commands
    Then the message sent to the agent labels the ticket text as untrusted data inside an explicit begin/end fence whose end marker precedes the trusted instruction sections
