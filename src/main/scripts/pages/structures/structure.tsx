/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Edit } from "@metreeca/tile/tiles/icon";
import { ToolPage } from "../../tiles/page";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolStructure() {
	return (

		<ToolPage

			item={(
				<>
					<a href={"/structures/"}>Structures</a>
					<a href={"/structures/123"}>University of Neverland</a>
				</>
			)}

			menu={<button><Edit/></button>}

		>

			<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce gravida vulputate leo ut placerat. Morbi
				tempor egestas turpis, eu rutrum lacus pharetra sit amet. Fusce in auctor erat. Duis bibendum nibh elit,
				eget blandit quam vulputate et. Cras sit amet risus at neque varius fringilla a sit amet felis. Morbi
				pellentesque lobortis posuere. Pellentesque purus est, posuere vitae est eu, mollis eleifend est. Integer
				molestie ut tellus ut faucibus.</p>
			<p>Nam mauris orci, mattis accumsan nisi eget, tempor tempus odio. Sed pellentesque est sit amet magna
				lacinia placerat. Quisque aliquet lectus ex, in semper mauris aliquet in. Aliquam vehicula ante facilisis
				congue sagittis. Donec mattis risus vel nulla vestibulum euismod. Sed ultrices ullamcorper dapibus. Etiam
				ultricies eget purus id porttitor. Curabitur non commodo ex. Donec sit amet finibus lectus, vitae semper
				libero. Quisque varius pellentesque sem, vel tempor augue. Donec id mi sit amet leo convallis sodales.
				Integer vulputate lacus augue, sed porttitor felis vehicula non.</p>
			<p>
				Nullam dolor urna, gravida eu ultricies vel, vestibulum ut mi. Pellentesque id feugiat nulla. Curabitur
				laoreet, magna eget auctor accumsan, urna nibh laoreet nunc, id consequat dui erat eu libero. Praesent
				tristique mauris sapien, vitae gravida leo ultricies a. Maecenas finibus aliquet fermentum. Vivamus ut
				ante mauris. Cras bibendum eget sem a luctus. In eleifend lectus quam, at efficitur lorem gravida vel.
				Aenean ut justo lacinia nisi mattis ultricies. Morbi eu dignissim ex, et blandit nibh. Sed sed ligula sed
				odio malesuada viverra non a sem. Sed massa augue, tristique vel cursus eu, dictum vitae ante. Nam
				accumsan imperdiet scelerisque. Sed luctus fringilla ipsum, non pretium ipsum aliquam at.
			</p>
			<p>
				Quisque efficitur ut nibh a luctus. Morbi et urna in leo consequat mollis. Donec risus ipsum, aliquam sit
				amet laoreet ac, congue eu ex. Proin laoreet, leo sed ullamcorper auctor, ipsum nisi interdum lacus, ut
				congue nisi erat nec augue. Praesent sollicitudin felis non nulla cursus molestie eu sit amet metus.
				Proin vel fringilla turpis. In hac habitasse platea dictumst. Sed et porta dolor. Aliquam porta iaculis
				elit at pulvinar. Phasellus mi arcu, ultricies vitae justo sed, congue tincidunt lectus. Pellentesque
				ornare augue blandit est tempus, et cursus mauris malesuada.
			</p>
			<p>
				Etiam cursus lacinia aliquet. Cras ac finibus neque, ut pharetra leo. Integer at magna ac tortor mollis
				faucibus. Cras magna diam, laoreet et libero sit amet, venenatis sagittis orci. Maecenas ultrices feugiat
				ante eget convallis. Sed at porta ligula. Duis et rutrum metus. Aenean congue risus nec libero
				scelerisque, id pretium arcu interdum. Sed at nulla eu lacus mattis faucibus. Donec iaculis sem ac magna
				egestas, a lobortis erat placerat. Vivamus nunc est, iaculis in porttitor lacinia, pharetra iaculis nunc.
				Aliquam quis feugiat nisi. Sed mollis augue ut mi malesuada gravida.
			</p>

		</ToolPage>

	);

}
