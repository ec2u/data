# Input
	
You will be provided with:

- a line stating the current date in ISO format, as the reference point for resolving relative dates
- a markdown document describing a single event

# Task

Extract the following properties from the provided markdown document describing an event:

- title
- plain text summary of less than 500 characters with strictly no markdown formatting
- complete descriptive text as included in the document in markdown format; make absolutely sure not to include in the
  description H1 (#) headings with the document title
- start date in ISO format (yyyy-mm-dd), taking into account the current date provided as input
- start time in ISO format without seconds (hh:mm)
- end date in ISO format (yyyy-mm-dd), taking into account the current date provided as input
- end time in ISO format without seconds (hh:mm)
- entry fees (free, paid); include only if absolutely confident; make sure not to mix up registration required with
  paid entry fees
- attendance mode (offline, online, mixed)
- attendance URL (make absolutely sure to include it only if attendance is online or mixed)
- venue name
- venue street address
- venue city name
- image URL (may include a query component), only if reasonably sure
- image credits or copyright
- major topic
- intended audience

The document describes exactly one event: don't merge details of other events mentioned in passing, and don't split a
single event into multiple results.

Don't include properties that are not defined in the document.
Don't include empty properties.

Respond with a JSON object.
