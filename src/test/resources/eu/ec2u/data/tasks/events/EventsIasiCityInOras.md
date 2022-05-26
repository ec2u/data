# Site

Commercial site where events are published for a fee.

* https://iasi.inoras.ro/evenimente
  * InOras / Evenimente in Iași
  * InOras / Events in Iasi

# API

* RSS
  * https://iasi.inoras.ro/feed/
  * Wordpress

* JSON
  * undocumented SON API @ `POST https://iasi.inoras.ro/wp-admin/admin-ajax.php`
  * capture call details from network events while loading https://iasi.inoras.ro/evenimente/
  * includes structured location / time data, but is quite complex and apparently not intended for external usage
* ~~JSON-LD~~
  * `WebPage` description included in pages referenced from RSS feed
  * no `Event` description
* ~~iCalendar~~
  * event generated for download, but apparently no accessible calendar

# Integration

* standard WordPress/RSS adapter

## 2022-05-25

* initial integration

# Content

* `schema:url`
* `schema:name`
* `schema:description`
* `dct:subject`

# Samples

```http
GET https://iasi.inoras.ro/feed/
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">

    <channel>
        <title>In Oras &#8211; Iasi</title>
        <atom:link href="https://iasi.inoras.ro/feed/" rel="self" type="application/rss+xml"/>
        <link>https://iasi.inoras.ro</link>
        <description>Iasi</description>
        <lastBuildDate>Tue, 17 May 2022 12:36:18 +0000</lastBuildDate>
        <language>ro-RO</language>
        <sy:updatePeriod>
            hourly
        </sy:updatePeriod>
        <sy:updateFrequency>
            1
        </sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.3</generator>

        <image>
            <url>https://iasi.inoras.ro/wp-content/uploads/sites/2/2020/01/download.png</url>
            <title>In Oras &#8211; Iasi</title>
            <link>https://iasi.inoras.ro</link>
            <width>32</width>
            <height>32</height>
        </image>
      
        <item>
            <title>MNLR Iași susține artiștii din Ucraina</title>
            <link>https://iasi.inoras.ro/2022/05/19/mnlr-iasi-sustine-artistii-din-ucraina/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=mnlr-iasi-sustine-artistii-din-ucraina</link>
            <comments>https://iasi.inoras.ro/2022/05/19/mnlr-iasi-sustine-artistii-din-ucraina/#respond</comments>
            <pubDate>Thu, 19 May 2022 04:30:54 +0000</pubDate>
            <dc:creator><![CDATA[Super admin]]></dc:creator>
            <category><![CDATA[Noutăți]]></category>

            <guid isPermaLink="false">https://iasi.inoras.ro/?p=59230</guid>
            <description><![CDATA[<p>MNLR Iași s-a alăturat campaniei Artiști români pentru artiști ucraineni, proiect de strângere de fonduri inițiat de UNITER (Uniunea Teatrală din România) pentru susținerea artiștilor din Ucraina. Astfel, în perioada următoare, Muzeul Național al Literaturii Române Iași va găzdui o serie de spectacole-lectură după textele unor dramaturgi ucraineni contemporani, scrise după declanșarea războiului din Ucraina. [&#8230;]</p>
<p>Articolul <a rel="nofollow" href="https://iasi.inoras.ro/2022/05/19/mnlr-iasi-sustine-artistii-din-ucraina/">MNLR Iași susține artiștii din Ucraina</a> apare prima dată în <a rel="nofollow" href="https://iasi.inoras.ro">In Oras - Iasi</a>.</p>
]]></description>
            <content:encoded><![CDATA[<p>MNLR Iași s-a alăturat campaniei <em>Artiști români pentru artiști ucraineni, </em>proiect de strângere de fonduri inițiat de UNITER (Uniunea Teatrală din România) pentru susținerea artiștilor din Ucraina.</p>
<p>Astfel, în perioada următoare, Muzeul Național al Literaturii Române Iași va găzdui o serie de spectacole-lectură după textele unor dramaturgi ucraineni contemporani, scrise după declanșarea <a href="https://iasi.inoras.ro/2022/03/03/punct-de-colecta-pentru-ucraina-la-casa-muzeelor/" target="_blank" rel="noopener noreferrer">războiului din Ucraina</a>. Spectacolele sunt susținute de actori profesioniști din Iași și coordonate de Antonella Cornici.</p>
<p><span class="aligncenter"><img class="aligncenter wp-image-59234 size-full" src="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/MNLR-Iași-susține-artiștii-din-Ucraina.jpg" alt="MNLR Iași susține artiștii din Ucraina" width="600" height="423" srcset="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/MNLR-Iași-susține-artiștii-din-Ucraina.jpg 600w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/MNLR-Iași-susține-artiștii-din-Ucraina-300x212.jpg 300w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/MNLR-Iași-susține-artiștii-din-Ucraina-450x317.jpg 450w" sizes="(max-width: 600px) 100vw, 600px" /></span></p>
<p>Primul spectacol-lectură a avut  loc miercuri, 18 mai 2022, în sala de conferințe de la Casa Muzeelor. Astfel, cu începere de la ora 16:00, publicul se va putea bucura de DICȚIONAR DE EMOȚII PE TIMP DE RĂZBOI de Elena Astasieva și PLANTĂM UN MĂR de Irina Hareț, avându-i în distribuție pe Ionuț Cornilă, Ioana Aciobăniței, Vasilica Bălăiță, regia aparținându-i Antonellei Cornici.</p>
<p>Intrarea este gratuită, dar donațiile pentru artiștii ucraineni sunt încurajate. Acestea merg în Fondul de Solidaritate Teatrală RO22RNCB0072049712860086 deschis la BCR – Sucursala Sector 1.</p>
<p>Alte spectacole programate la MNLR Iași sunt:</p>
<p>&nbsp;</p>
<p>Joi, 26 mai &#8211; Sala de Conferințe, Casa Muzeelor, ora 16.00</p>
<p><em>SAȘA DU GUNOIUL</em> de Natalia Vorojbit</p>
<p>Regie: Cristi Avram</p>
<p>Distribuție: Catinca Tudose, Alexandra Bandac, Daniel Onoae</p>
<p>&nbsp;</p>
<p>Marți, 31 mai &#8211; Sala de Conferințe, Casa Muzeelor, ora 16.00</p>
<p>COPIII NOȘTRI de Natalia Blok</p>
<p>Regie: Erica Moldovan</p>
<p>Distribuție: Vasilica Bălăiță, Dani Popa, Dumitru Georgescu, Dorian Leonte</p>
<p>&nbsp;</p>
<p>Duminică, 5 iunie &#8211; Sala Studio J, Muzeul „Vasile Pogor”, ora 16.00</p>
<p>ȚARA MEA de Liudmila Timoșenko</p>
<p>VREAU ACASĂ de Oksana Savcenko</p>
<p>Regie: Bogdan Ujeniuc</p>
<p>Distribuție: Irina Plumb, Ana Maria Fasolă</p>
<p>&nbsp;</p>
<p>Duminică, 12 iunie &#8211; Sala Studio J, Muzeul „Vasile Pogor”, ora 16.00</p>
<p>SĂ LE SPUNEM PE NUME de Tetiana Kițenko</p>
<p>Regie: Andrei Piu</p>
<p>Distribuție: Ștefi Sandu, Cosmin Manoliu</p>
<p>&nbsp;</p>
<p>Detaliile spectacolelor vor fi publicate pe site-ul www.muzeulliteraturiiiasi.ro, precum și pe pagina de Facebook a Muzeului Național al Literaturii Române Iași.</p>
<p>Campania <em>Artiști români pentru artiști ucraineni </em>este un proiect de strângere de fonduri care se desfășoară în perioada 16 mai – 15 iunie, inițiat de UNITER (Uniunea Teatrală din România) în parteneriat cu Worldwide Reading Project și CITD (The Center for International Theatre Development) din Baltimore. Instituții de cultură din România și Republica Moldova organizează spectacole lectură pe baza a 10 texte scrise de autori ucraineni, iar fondurile strânse sunt direcționate cauzei susținerii artiștilor ucraineni.</p>
<p>Cei care doresc să susțină campania o pot face donând direct în urna din sălile spectacolelor-lectură sau donând în contul special deschis de Asociația UNITER, Fondul de Solidaritate Teatrală RO22RNCB0072049712860086 BCR SECTOR 1.</p>
<p>Articolul <a rel="nofollow" href="https://iasi.inoras.ro/2022/05/19/mnlr-iasi-sustine-artistii-din-ucraina/">MNLR Iași susține artiștii din Ucraina</a> apare prima dată în <a rel="nofollow" href="https://iasi.inoras.ro">In Oras - Iasi</a>.</p>
]]></content:encoded>
            <wfw:commentRss>https://iasi.inoras.ro/2022/05/19/mnlr-iasi-sustine-artistii-din-ucraina/feed/
            </wfw:commentRss>
            <slash:comments>0</slash:comments>
        </item>
        <item>
            <title>&#8222;Folclorul din cărți&#8221;- eveniment cultural inedit</title>
            <link>https://iasi.inoras.ro/2022/05/18/folclorul-din-carti-eveniment-cultural-inedit/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=folclorul-din-carti-eveniment-cultural-inedit</link>
            <comments>https://iasi.inoras.ro/2022/05/18/folclorul-din-carti-eveniment-cultural-inedit/#respond</comments>
            <pubDate>Wed, 18 May 2022 04:22:43 +0000</pubDate>
            <dc:creator><![CDATA[Super admin]]></dc:creator>
            <category><![CDATA[Noutăți]]></category>

            <guid isPermaLink="false">https://iasi.inoras.ro/?p=59226</guid>
            <description><![CDATA[<p>Miercuri, 18 mai 2022, ora 18, în sala „Eduard Caudella” a Universității Naționale de Arte „George Enescu” din Iași va avea loc un eveniment cultural inedit, intitulat „Folclorul din cărți”, constând în lansarea a cinci titluri de referință din domeniul folclorului muzical și al muzicii bisericești, editate sub coordonarea muzicologului Dr. Constanța Cristescu, cu sprijinul  Centrului [&#8230;]</p>
<p>Articolul <a rel="nofollow" href="https://iasi.inoras.ro/2022/05/18/folclorul-din-carti-eveniment-cultural-inedit/">&#8222;Folclorul din cărți&#8221;- eveniment cultural inedit</a> apare prima dată în <a rel="nofollow" href="https://iasi.inoras.ro">In Oras - Iasi</a>.</p>
]]></description>
            <content:encoded><![CDATA[<div><strong>Miercuri, 18 mai 2022, ora 18</strong>, în sala <strong>„<a href="https://iasi.inoras.ro/2021/11/27/concursul-eduard-caudella-s-a-incheiat/" target="_blank" rel="noopener noreferrer">Eduard Caudella</a>”</strong> a Universității Naționale de Arte „George Enescu” din Iași va avea loc un eveniment cultural inedit, intitulat <strong>„Folclorul din cărți”</strong>, constând în lansarea a cinci titluri de referință din domeniul folclorului muzical și al muzicii bisericești, editate sub coordonarea muzicologului Dr. Constanța Cristescu, cu sprijinul  Centrului Cultural „Bucovina” din Suceava:</div>
<ul>
<li><strong>Alexandru Voevidca, <em>Folclor muzical din Bucovina</em> – vol. IV. Cântecul vocal de joc </strong>(continuare la vol. III), <strong>Doina. Balada</strong>, ediție critică, catalog tipologic muzical și antologie de <strong>Dr. Constanța Cristescu</strong>, Editura Lidana, Suceava, 2020.</li>
<li><strong>Constanța Cristescu, <em>Un secol de etnomuzicologie românească. Parcurs și perspectivă în sistematica repertorială</em>, </strong>Editura Muzicală, București, 2021.</li>
<li><strong><em>Ghidul iubitorilor de folclor</em>, </strong>vol. X, responsabil de proiect <strong>Dr. Constanța Cristescu</strong>, Editura Lidana, Suceava, 2020.</li>
<li><strong><em>Anastasimatar arădean</em>, alcătuit după notațiile muzicale ale lui Trifon Lugojan, de Constanța Cristescu, </strong>Editura Eurostampa, Timișoara, 2021.</li>
<li><strong>Viorel Bârleanu &amp; Florin Bucescu, <em>Melodii instrumentale de joc din Moldova</em>, </strong>ediție îngrijită de<strong> Irina Zamfira Dănilă</strong>, Editura Muzicală, București, 2021.</li>
</ul>
<p><span class="aligncenter"><img class="aligncenter wp-image-59227 size-full" src="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/lansare-carte-Folclorul-din-carti.jpg" alt="lansare carte Folclorul din carti" width="600" height="849" srcset="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/lansare-carte-Folclorul-din-carti.jpg 600w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/lansare-carte-Folclorul-din-carti-212x300.jpg 212w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/lansare-carte-Folclorul-din-carti-450x637.jpg 450w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/lansare-carte-Folclorul-din-carti-565x800.jpg 565w" sizes="(max-width: 600px) 100vw, 600px" /></span></p>
<div>
<p>Vor lua cuvântul muzicologul dr. <strong>Constanța Cristescu</strong>, prof. univ. dr. <strong>Laura Vasiliu</strong>, conf. univ. dr. <strong>Ciprian Chițu</strong>, conf. univ. dr. <strong>Irina Zamfira Dănilă</strong> și etnomuzicologul profesor <strong>Viorel Bârleanu</strong>. Lansarea de carte va fi însoțită de ilustrare muzical-coregrafică de colecție, susținută <em>live</em> de ansamblurile folclorice „T. T. Burada” al Universității Naționale de Arte „George Enescu” din Iași (dirijor, Ciprian Chițu), „Doina Carpaților” al Casei de Cultură a Studenților din Iași (coregraf, Mihaela Cojocaru) și „Floralia &#8211; instrumental” al Universității Naționale de Arte „George Enescu” din Iași (coordonator, Irina Zamfira Dănilă).</p>
<p>Evenimentul este coordonat de conf. univ. dr. Irina Zamfira Dănilă, de la Departamentul de Studii Muzicale teoretice din cadrul Facultății de Interpretare Muzicală, Compoziție și Studii Muzicale Teoretice a Universității Naționale de Arte „George Enescu” din Iași.</p>
<p>La evenimentul <strong>„Folclorul din cărți” </strong>intrarea este liberă.</p>
</div>
<p>Articolul <a rel="nofollow" href="https://iasi.inoras.ro/2022/05/18/folclorul-din-carti-eveniment-cultural-inedit/">&#8222;Folclorul din cărți&#8221;- eveniment cultural inedit</a> apare prima dată în <a rel="nofollow" href="https://iasi.inoras.ro">In Oras - Iasi</a>.</p>
]]></content:encoded>
            <wfw:commentRss>https://iasi.inoras.ro/2022/05/18/folclorul-din-carti-eveniment-cultural-inedit/feed/
            </wfw:commentRss>
            <slash:comments>0</slash:comments>
        </item>
        <item>
            <title>Simulare de incediu la Centrul Comercial Felicia</title>
            <link>https://iasi.inoras.ro/2022/05/17/simulare-de-incediu-la-centrul-comercial-felicia/?utm_source=rss&#038;utm_medium=rss&#038;utm_campaign=simulare-de-incediu-la-centrul-comercial-felicia</link>
            <comments>https://iasi.inoras.ro/2022/05/17/simulare-de-incediu-la-centrul-comercial-felicia/#respond
            </comments>
            <pubDate>Tue, 17 May 2022 06:39:42 +0000</pubDate>
            <dc:creator><![CDATA[Super admin]]></dc:creator>
            <category><![CDATA[Noutăți]]></category>

            <guid isPermaLink="false">https://iasi.inoras.ro/?p=59096</guid>
            <description><![CDATA[<p>Astazi, 17 mai 2022, Centrul Comercial Felicia si hypermarketul Carrefour, impreuna cu reprezentantii Inspectoratului pentru Situatii de Urgenta Iasi, au organizat un exercitiu de evacuare in caz de incendiu, cu scopul de a asigura buna functionare si instruire a personalului, in cazul producerii unor evenimente cum ar fi incendiu, cutremur sau inundatie. Simularea a avut [&#8230;]</p>
<p>Articolul <a rel="nofollow" href="https://iasi.inoras.ro/2022/05/17/simulare-de-incediu-la-centrul-comercial-felicia/">Simulare de incediu la Centrul Comercial Felicia</a> apare prima dată în <a rel="nofollow" href="https://iasi.inoras.ro">In Oras - Iasi</a>.</p>
]]></description>
            <content:encoded><![CDATA[<p>Astazi, 17 mai 2022, Centrul Comercial Felicia si hypermarketul Carrefour, impreuna cu reprezentantii Inspectoratului pentru Situatii de Urgenta Iasi, au organizat un exercitiu de evacuare in caz de incendiu, cu scopul de a asigura buna functionare si instruire a personalului, in cazul producerii unor evenimente cum ar fi incendiu, cutremur sau inundatie.</p>
<p><span class="aligncenter"><img class="aligncenter wp-image-59097 size-full" src="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-6.jpg" alt="simulare-incendiu-centrul-comercial-felicia (6)" width="600" height="338" srcset="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-6.jpg 600w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-6-300x169.jpg 300w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-6-450x254.jpg 450w" sizes="(max-width: 600px) 100vw, 600px" /></span></p>
<p>Simularea a avut loc in aceasta dimineata, in jurul orei 7.00 si a inceput cu un apel la 112, in urma caruia Inspectoratul pentru Situatii de Urgenta Iasi a intervenit cu echipaje si autospeciale.</p>
<p>La fata locului, au sosit cinci autospeciale, dintre care o descarcerare, care a intervenit pentru salvarea unei presupuse victime.</p>
<p>Scenariul a implicat si personalul specializat si echipamentele proprii, din cadrul Centrului Comercial Felicia si hypermarketul Carrefour. Astfel, s-a urmarit implementarea procedurilor pentru situatii de urgenta, cum ar fi respectarea timpilor, verificarea cailor de acces si evacuarea tuturor persoanelor.</p>
<p>In urma exercitiului, se va analiza si evalua eficienta procedurilor de interventie, pentru situatii de urgenta.</p>
<p><span class="aligncenter"><img class="aligncenter wp-image-59098 size-full" src="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-1.jpg" alt="simulare-incendiu-centrul-comercial-felicia (1)" width="600" height="800" srcset="https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-1.jpg 600w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-1-225x300.jpg 225w, https://iasi.inoras.ro/wp-content/uploads/sites/2/2022/05/simulare-incendiu-centrul-comercial-felicia-1-450x600.jpg 450w" sizes="(max-width: 600px) 100vw, 600px" /></span></p>
<p>Articolul <a rel="nofollow" href="https://iasi.inoras.ro/2022/05/17/simulare-de-incediu-la-centrul-comercial-felicia/">Simulare de incediu la Centrul Comercial Felicia</a> apare prima dată în <a rel="nofollow" href="https://iasi.inoras.ro">In Oras - Iasi</a>.</p>
]]></content:encoded>
            <wfw:commentRss>https://iasi.inoras.ro/2022/05/17/simulare-de-incediu-la-centrul-comercial-felicia/feed/
            </wfw:commentRss>
            <slash:comments>0</slash:comments>
        </item>
       
    </channel>
</rss>

```
