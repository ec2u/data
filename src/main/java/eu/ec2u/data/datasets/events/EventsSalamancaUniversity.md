# Site

* https://sac.usal.es/programacion/
  * Universidad de Salamanca / Servicio de Actividades Culturales
  * University of Salamanca / Cultural Activities Service

# API

* iCalendar
  * https://calendar.google.com/calendar/ical/c_jd0an7mstid1af3do1ija5flsk%40group.calendar.google.com/public/basic.ics
  * Google-based

# Integration

* custom iCalendar adapter based on https://github.com/ical4j/ical4j

## Pending

* `STATUS` to `schema:eventStatus` mapping
  * requires a dictionary of possible input values

## 2022-05-20

* upgraded from WordPress RSS to iCalendar integration

# Content

* `schema:url`
  * not always populated

* `schema:name`
* `schema:description`
* `schema:startDate`
* `schema:endDate`

# Samples

```http
GET https://calendar.google.com/calendar/ical/c_jd0an7mstid1af3do1ija5flsk%40group.calendar.google.com/public/basic.ics
```

```ical
BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:USAL - Calendario SAC
X-WR-TIMEZONE:Europe/Madrid
BEGIN:VEVENT
DTSTART:20220605T180000Z
DTEND:20220605T183000Z
DTSTAMP:20220520T100229Z
UID:1ge34odvj9773ted5qfhs1e6oa@google.com
CREATED:20220519T164634Z
DESCRIPTION:<h3><strong>Big Band</strong></h3><h3>Universidad de Salamanca<
 /h3><h4>Artista invitado: Fernando Hurtado (trompeta)</h4><p>&nbsp\;</p><p>
 <strong>Repertorio</strong></p><ol><li>IN THE MOOD (Tar Paper Stomp / Glenn
  Miller)</li><li>IN A MELLOW TONE (Duke Ellington / Arr.: Duccio Bertini)</
 li><li>CAN’T WE BE FRIENDS (Nelson Riddle)</li><li>THE LADY IS A TRAMP (Ric
 hard Rodgers &amp\; Lorenz Hart / Arr.: Dave Wolpe)</li><li>FEVER (John Dav
 enport &amp\; Eddie Cooley / Arr.: Roger Holmes)</li><li>THE NEARNESS OF YO
 U (Ned Washington &amp\; Hoagy Carmichael / Arr.: Dave Hanson)</li><li>BLUE
  SKIES (Irving Berlin / Arr: Roger Holmes)</li><li>ADDERLEY (Víctor Antón)<
 /li><li>GROOVIN’ HARD (Don Menza / Arr.: Dave Barduhn)</li><li>ONE MORE ONC
 E (Matt Amy)</li><li>PERFIDIA (Alberto Domínguez / Arr: Ray Santos)</li><li
 >SWAY (Norman Gimbel &amp\; Pablo Beltran Ruiz / Arr.: Humberto Gatica)</li
 ><li>SALSA FOR NORMAN (Miguel Blanco)</li></ol><p>&nbsp\;</p><p><strong>Mús
 icos</strong></p><p>Artista invitado</p><ul><li>Fernando Hurtado (Trompeta)
 </li></ul><p>Dirección</p><ul><li>Alberto Palomares</li></ul><p>Voz</p><ul>
 <li>Marian Fonseca</li><li>Isabel Blázquez Sánchez</li><li>Marta Maíllo Pér
 ez de Burgos</li></ul><p>Saxos</p><ul><li>Sergio Bravo</li><li>Diego Fernán
 dez Gavela</li><li>Antonio Díez</li><li>Carlos Calzada</li><li>Sergio Pozzi
 </li><li>Derek Mc Ardle Narbón</li></ul><p>Trompetas</p><ul><li>Juan Ma Gar
 cía</li><li>Raquel Rodríguez Rodríguez</li><li>Alba Rodriguez Zapatero</li>
 <li>Iván Abalo Barros</li></ul><p>Trombones</p><ul><li>Jesús Campo</li><li>
 Daniel Maíllo Gómez &nbsp\;</li><li>Natalia Llamazares González</li><li>Mar
 celo Véliz</li></ul><p>&nbsp\;</p><p>Piano</p><ul><li>Pedro Pecero Caballer
 o</li><li>Giuliano Parisi</li></ul><p>Guitarra</p><ul><li>Laura Crimson</li
 ></ul><p>Contrabajo</p><ul><li>Enrique Luján Millán</li><li>Alberto Palomar
 es Fonseca</li></ul><p>Batería y percusión</p><ul><li>Manuel García Sánchez
 </li><li>Jose Campusano “Cote”</li><li>Diego de Luis</li></ul>
LAST-MODIFIED:20220519T164634Z
LOCATION:https://sac.usal.es/show-item/big-band-universidad-de-salamanca-20
 22/
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Big Band Universidad de Salamanca
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART:20220609T180000Z
DTEND:20220609T190000Z
DTSTAMP:20220520T100229Z
UID:0b1bj2evv42s763tot7741910n@google.com
CREATED:20220518T094403Z
DESCRIPTION:<br><br><br><br><br><br><br><br><br><br><h5>Jueves\, 9 de junio
  de 2022</h5><h5>Teatro Juan del Enzina 20:00 h</h5><h5>Entrada libre hasta
  completar aforo</h5><h5>&nbsp\;</h5><h5>Programa</h5><p><strong>Dmitri Sch
 ostakóvich&nbsp\;</strong>(1906-1975)\, Preludio y Fuga op. 84 n.º 4 en mi 
 menor(1951)</p><p>&nbsp\;</p><p><strong>Sergei Prokofiev</strong>&nbsp\;(18
 91-1953)\, Sonata n.º 9 op. 103 en do mayor (1947)</p><p>&nbsp\;&nbsp\;&nbs
 p\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\; Allegretto</p><
 p>&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nb
 sp\; Allegro Strepitoso</p><p>&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nb
 sp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\; Andante tranquilo</p><p>&nbsp\;&nbsp\;&nbs
 p\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\; Allegro con bri
 o\, ma non troppo presto</p><p>&nbsp\;</p><p><strong>Maurice Ravel</strong>
 &nbsp\;(1895-1937)\,&nbsp\; Miroirs n.º 3 (1904)</p><p>&nbsp\;&nbsp\;&nbsp\
 ;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\; Une barque sur l’
 ocean</p><p>&nbsp\;</p><p><strong>Claude Debussy</strong>&nbsp\;(1862-1818)
 \, Images I&nbsp\; L.110 (1901-1905)</p><p>&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbs
 p\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\; Reflets dans l’eau</p><p>&nbs
 p\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\; H
 ommage à Rameau</p><p>&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbsp\;&nbs
 p\;&nbsp\;&nbsp\;&nbsp\; Mouvement</p><p>&nbsp\;</p><p><strong>Iria San Mar
 cial Comesaña</strong></p><p>Iria San Marcial Comesaña (Vigo\, 4 de octubre
  de 1996) inicia sus estudios elementales de piano a los ocho años en el Co
 nservatorio Profesional de Música de Vigo con la profesora Mar Gómez. En es
 te centro finaliza en 2015 el Grado Profesional de Música en la especialida
 d de piano de la mano del profesor David Vásconez\, mismo año en el que es 
 admitida en el Conservatorio Superior de Música de Vigo e inicia el Grado S
 uperior con el profesor Arabel Moráguez. Finaliza sus estudios superiores e
 n el año 2019 con el profesor Nicasio Gradaílle y un año después comienza e
 l Máster de Enseñanzas Artísticas de Interpretación Musical en la Especiali
 dad Solista en el Conservatorio Superior de Música de Castilla y León con e
 l Prof. Brenno Ambrosini. Además de su formación en Vigo y en Salamanca\, r
 eside durante el tercer curso del grado superior en Vilnius\, gracias a su 
 participación en el programa Erasmus+\, donde estudia en la Academia de Mús
 ica y Teatro de Lituania con la profesoras Birute Vainunaite y Audrone Kisi
 elute. Ha asistido a masterclases con profesores de reconocimiento internac
 ional como Anna Fedorova\, Ellen Corver\, Luis Filipe de Sá o Sofia Lourenç
 o\, entre otros.</p><p>En el año 2015 recibe el Premio Extraordinario de Fi
 n de Grado y el segundo premio en la segunda edición del “Concurso Rosalian
 o” organizado por el Conservatorio Profesional de Vigo. En el año 2017 es f
 inalista en el Piano Meeting de la ciudad de Ourense. En el año 2019 obtien
 e junto con sus compañeros Raúl Reyes (clarinete) y Mélisa Karic (violín) e
 l Primer Premio del Concurso de Música de Cámara organizado por el Conserva
 torio Superior de Vigo.&nbsp\;</p><p>Iria San Marcial ha realizado conciert
 os como solista en ciudades de Galicia como Vigo\, Ourense o Redondela\, ad
 emás de ciudades de otros países como Áncora (Portugal)\, Vilnius (Lituania
 ) o Foligno (Italia).&nbsp\; &nbsp\;Además de sus conciertos como solista\,
  ha participado en conciertos de música de cámara en el festival Camiños So
 noros 2019\, y ha colaborado como pianista acompañante en el Concurso de Cl
 arinete de Ourense 2017 y en el festival Intercentros Melómano 2015. En cua
 nto a música sinfónica\, Iria está federada como pianista en la banda Unión
  Musical de Cabral\, ha participado en el certamen de bandas de Aranda del 
 Duero con la Banda Municipal de Salvatierra y ha trabajado con la Banda Mun
 icipal de Monçao.</p><p>Actualmente compagina sus estudios de Máster con la
  docencia\, siendo profesora de piano en la Escuela Municipal de Música y D
 anza de Santa Marta de Tormes.</p>
LAST-MODIFIED:20220519T065043Z
LOCATION:https://sac.usal.es/role-member/iria-san-marcial-comesana-piano/
SEQUENCE:3
STATUS:CONFIRMED
SUMMARY:Música en escena - Iria San Marcial Comesaña (piano)
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR
```

