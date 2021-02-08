<?xml version="1.0" encoding="UTF-8"?>

<!--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Copyright © 2021-2021 EC2U Consortium

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-->

<xsl:stylesheet version="1.0" exclude-result-prefixes="html exslt msxsl"

                xmlns:html="http://www.w3.org/1999/xhtml"
                xmlns:xlink="http://www.w3.org/1999/xlink"

                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:exslt="http://exslt.org/common"
                xmlns:msxsl="urn:schemas-microsoft-com:xslt"

>

	<xsl:output doctype-system="about:legacy-compat" indent="yes"/> <!-- encoding set in head template -->

	<xsl:strip-space elements="*"/>
	<xsl:preserve-space elements="pre"/>

	<!--~~ Parameters ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-->

	<xsl:variable name="name">EC2U</xsl:variable>
	<xsl:variable name="copy">© 2021 EC2U Consortium</xsl:variable>


	<!--~~ Variables ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-->

	<xsl:variable name="test" select="system-property('xsl:vendor-url') != 'http://xml.apache.org/xalan-j'"/>

	<xsl:variable name="root" select="substring-before(substring(substring-after(
			/processing-instruction('xml-stylesheet'), 'href='), 2), '/index.xsl')"/>

	<xsl:variable name="title" select="/html:html/html:head/html:title"/>


	<!--~~ Template ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-->

	<xsl:template match="html:head">
		<xsl:element name="{local-name()}">

			<meta name="copyright" content="{$copy}"/>

			<meta name="viewport" content="width=device-width,initial-scale=1"/>
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>

			<link rel="shortcut icon" href="{$root}/assets/icon.svg"/>
			<link rel="stylesheet" type="text/css" href="{$root}/index.css"/> <!-- before inline styles -->

			<xsl:apply-templates select="/html:html/html:head/*"/>

		</xsl:element>
	</xsl:template>

	<xsl:template match="html:title">
		<xsl:element name="{local-name()}">

			<xsl:value-of select="string()"/>

			<xsl:if test="string() != ''">
				<xsl:text> | </xsl:text>
			</xsl:if>

			<xsl:value-of select="$name"/>

		</xsl:element>
	</xsl:template>

	<xsl:template match="html:body">
		<xsl:element name="{local-name()}">

			<nav>

				<header>

					<nav>

						<button>
							<svg class="feather" style="transform: scaleX(-1);">
								<use xlink:href="{$root}/assets/feather.svg#log-out"/>
							</svg>
						</button>

						<a href="{$root}/index.xhtml">Tino Faussone</a>

					</nav>

					<h1>
						<a class="ec2u" href="{$root}/index.xhtml"/>
					</h1>

				</header>

				<section>

					<xsl:apply-templates select="html:nav/*"/>

				</section>

			</nav>

			<main>

				<xsl:apply-templates select="html:header"/>
				<xsl:apply-templates select="html:section"/>

			</main>

		</xsl:element>
	</xsl:template>


	<!--~~ Elements ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-->

	<xsl:template match="html:style|html:script"> <!-- don't escape special characters in CDATA sections -->
		<xsl:element name="{local-name()}">
			<xsl:apply-templates select="@*"/>
			<xsl:value-of select='.' disable-output-escaping="yes"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="*[@data-icon]">

		<xsl:element name="{local-name()}">

			<xsl:apply-templates select="@*"/>

			<svg class="feather">
				<use xlink:href="{$root}/assets/feather.svg#{@data-icon}"/>
			</svg>

			<xsl:apply-templates/>

		</xsl:element>

	</xsl:template>

	<xsl:template match="html:a|a"> <!-- process also header/footer links -->
		<xsl:element name="{local-name()}">

			<xsl:if test="not(@target) and starts-with(@href, 'http')">
				<xsl:attribute name="target">_blank</xsl:attribute>
			</xsl:if>

			<xsl:apply-templates select="@*"/>

			<xsl:choose>

				<xsl:when test="not(node() or contains(@class, 'more'))
								and (starts-with(@href, '.') or starts-with(@href, '/'))">
					<xsl:value-of select="string(document(@href, /)//html:title)"/>
				</xsl:when>

				<xsl:otherwise>
					<xsl:apply-templates/>
				</xsl:otherwise>

			</xsl:choose>

		</xsl:element>
	</xsl:template>

	<xsl:template match="@href|@src">

		<xsl:variable name="stripped">
			<xsl:choose>

				<xsl:when test="$test">
					<xsl:value-of select="string()"/>
				</xsl:when>

				<xsl:when test="contains(., 'index.xhtml')">
					<xsl:value-of select="substring-before(., 'index.xhtml')"/>
				</xsl:when>

				<xsl:when test="contains(., '.xhtml')">
					<xsl:value-of select="substring-before(., '.xhtml')"/>
				</xsl:when>

				<xsl:otherwise>
					<xsl:value-of select="string()"/>
				</xsl:otherwise>

			</xsl:choose>
		</xsl:variable>

		<xsl:variable name="absolute">
			<xsl:choose>

				<xsl:when test="$test">
					<xsl:value-of select="$stripped"/>
				</xsl:when>

				<xsl:when test="starts-with($stripped, $root)">
					<xsl:value-of select="substring-after($stripped, $root)"/>
				</xsl:when>

				<xsl:otherwise>
					<xsl:value-of select="$stripped"/>
				</xsl:otherwise>

			</xsl:choose>
		</xsl:variable>

		<xsl:attribute name="{local-name()}">
			<xsl:value-of select="$absolute"/>
		</xsl:attribute>

	</xsl:template>


	<!--~~ Defaults ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~-->

	<xsl:template match="*">
		<xsl:element name="{local-name()}">
			<xsl:apply-templates select="@*|node()"/>
		</xsl:element>
	</xsl:template>

	<xsl:template match="@*">
		<xsl:copy/>
	</xsl:template>

	<!--~~ ;(ie) exslt:node-set() polyfill (see http://www.tkachenko.com/blog/archives/000704.html) ~~~~~~~~~~~~~~~~~-->

	<msxsl:script language="JScript" implements-prefix="exslt">
		this['node-set'] = function (x) { return x }
	</msxsl:script>

</xsl:stylesheet>
