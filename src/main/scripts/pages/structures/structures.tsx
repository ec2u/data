/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { ToolInput } from "@metreeca/tile/tiles/controls/input";
import { ToolCard } from "../../tiles/card";
import { ToolPage } from "../../tiles/page";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolStructures() {
	return (

		<ToolPage

			item={<ToolInput placeholder="Discover Structures" value={["", () => {}]}/>}

			/*side={(
				<>
					<ToolFacet name={"University"}/>
					<ToolFacet name={"Type"}/>
				</>
			)}*/

		>

			<ToolCard

				site={<a href="/structures/1234">University of Nowhere</a>}
				name={<a href="/structures/1234">Proin Department</a>}

				tags={[<a href="/structures/">department</a>]}

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

				site={<a href="/structures/1234">University of Nowhere</a>}
				name={<a href="/structures/1234">Mollis Laboratory</a>}

				tags={[<a href="/structures/">university</a>, <a href="/structures/">department</a>]}

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

				site={<a href="/structures/1234">University of Nowhere</a>}
				name={<a href="/structures/1234">Pretium Center</a>}

				tags={[<a href="/structures/">university</a>, <a href="/structures/">department</a>]}

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

				site={<a href="/structures/1234">University of Nowhere</a>}
				name={<a href="/structures/1234">Proin Department</a>}

				tags={[<a href="/structures/">department</a>]}

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

				site={<a href="/structures/1234">University of Nowhere</a>}
				name={<a href="/structures/1234">Mollis Laboratory</a>}

				tags={[<a href="/structures/">university</a>, <a href="/structures/">department</a>]}

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

				site={<a href="/structures/1234">University of Nowhere</a>}
				name={<a href="/structures/1234">Pretium Center</a>}

				tags={[<a href="/structures/">university</a>, <a href="/structures/">department</a>]}

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
