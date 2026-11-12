The EC2U Knowledge Hub is the central knowledge sharing and semantic search facility of the
[EC2U Alliance](https://www.ec2u.eu/). It gathers content from EC2U universities and external sources, and publishes it
as cross-linked datasets about skills, courses, research, local events and other areas of common interest.

Each dataset is available through this interactive semantic search tool and through a machine-readable REST/JSON-LD API.
Both support faceted search and linked data navigation across every dataset and its cross-links.

The software running the hub is open source: its code, issue tracker and development history are on
[GitHub](https://github.com/ec2u/data), where you can also report problems with the hub or with its datasets.

# Publishers

EC2U universities and their local partners decide which of their content the hub carries and answer for its accuracy.
The hub harmonises that content and always links back to the original pages as the authoritative source. A correction
made at the source reaches the hub on the next scheduled harvest, with no further action needed.

To propose a new source or change how an existing one is harvested, open an [issue](https://github.com/ec2u/data/issues)
on GitHub. State the dataset, the address of the content, its languages and how often it is updated, and name a contact.

# Webmasters

The hub reads the pages of each source it harvests. Publish each property listed in the data models as a distinct
element, not inside free text. Give every resource a stable address and keep a listing page or feed linking to them all.

Before you move, redesign or retire a section the hub reads, open an issue on GitHub. The harvest can then be adapted in
time, so that your content stays on the hub without interruption, gaps or broken links back to your pages.

# Developers

The [API & Models](/about/api/) pages document the resources each dataset holds and the properties the API returns.

Each dataset states its licence on its info page. Reuse it within those terms and credit the EC2U Alliance as its
publisher. Content gathered from partner universities remains subject to the rights of its original publishers, as set
out in the [Legal Notice](legal/): check those rights through the source link of each resource before reusing it.
