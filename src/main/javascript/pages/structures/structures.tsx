/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Fragment, h } from "preact";
import { Link } from "preact-router";
import ToolCard from "../../tiles/card";
import ToolFacet from "../../tiles/facet";
import ToolPage from "../../tiles/page";
import ToolSearch from "../../tiles/search";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolStructures() {
	return (

		<ToolPage

			name={<ToolSearch placeholder="Discover Structures"/>}

			side={(
				<Fragment>
					<ToolFacet name={"University"}/>
					<ToolFacet name={"Type"}/>
				</Fragment>
			)}

		>

			<ToolCard

				site={<Link href="/structures/1234">University of Nowhere</Link>}
				name={<Link href="/structures/1234">Proin Department</Link>}

				tags={[<Link href="/structures/">department</Link>]}

			>

				Rhoncus dolor purus non enim. In mollis nunc sed id semper risus. In pellentesque massa placerat duis.
				Rutrum tellus pellentesque eu tincidunt tortor aliquam nulla. Sed nisi lacus sed viverra tellus in hac.
				Pellentesque habitant morbi tristique senectus et. Purus gravida quis blandit turpis cursus in hac.
				Facilisi nullam vehicula ipsum a arcu. Pretium quam vulputate dignissim suspendisse in. Adipiscing elit
				pellentesque habitant morbi tristique senectus et. Gravida cum sociis natoque penatibus. Feugiat nisl
				pretium fusce id velit ut. Pulvinar mattis nunc sed blandit. Senectus et netus et malesuada fames ac
				turpis egestas. Ultrices vitae auctor eu augue ut.

			</ToolCard>

			<ToolCard

				site={<Link href="/structures/1234">University of Nowhere</Link>}
				name={<Link href="/structures/1234">Proin Department</Link>}

				tags={[<Link href="/structures/">university</Link>, <Link href="/structures/">department</Link>]}

			>

				Rhoncus dolor purus non enim. In mollis nunc sed id semper risus. In pellentesque massa placerat duis.
				Rutrum tellus pellentesque eu tincidunt tortor aliquam nulla. Sed nisi lacus sed viverra tellus in hac.
				Pellentesque habitant morbi tristique senectus et. Purus gravida quis blandit turpis cursus in hac.
				Facilisi nullam vehicula ipsum a arcu. Pretium quam vulputate dignissim suspendisse in. Adipiscing elit
				pellentesque habitant morbi tristique senectus et. Gravida cum sociis natoque penatibus. Feugiat nisl
				pretium fusce id velit ut. Pulvinar mattis nunc sed blandit. Senectus et netus et malesuada fames ac
				turpis egestas. Ultrices vitae auctor eu augue ut.

			</ToolCard>

		</ToolPage>

	);

}
