	# Input

A markdown document describing a single academic event.

The current date is {{date}}.

# Task

Extract the following properties from the provided document:

- title
- plain text summary of less than 500 characters with strictly no markdown formatting
- complete descriptive text as included in the document in markdown format; make absolutely
  sure not to include in the description H1 (#) headings with the document title; NEVER carry over
  navigation, listings of other events, or the page as a whole
- start date in ISO format (yyyy-mm-dd), resolving relative dates against the current date
- start time as hh:mm on a 24-hour clock; NEVER state seconds or a time zone offset, and NEVER use
  local notation such as 18h30
- end date in ISO format (yyyy-mm-dd), resolving relative dates against the current date
- end time as hh:mm on a 24-hour clock; NEVER state seconds or a time zone offset, and NEVER use
  local notation such as 18h30
- entry fees (free, paid); include only if absolutely confident; make sure not to mix up
  registration required with paid entry fees
- attendance mode (offline, online, mixed)
- attendance URL (make absolutely sure to include it only if attendance is online or mixed)
- venue name
- venue street address
- venue city name
- image URL (may include a query component), only if reasonably sure
- image credits or copyright
- major topic
- intended audience
- language as guessed from the description as a 2-letter ISO tag

# Output

Respond with a JSON object.

Don't include properties that are not defined in the document.
Don't include empty properties.
