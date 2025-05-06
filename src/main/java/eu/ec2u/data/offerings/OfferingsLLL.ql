# Matching between curated sheet and knowledge hub

PREFIX ec2u: <https://data.ec2u.eu/terms/>
PREFIX schema: <https://schema.org/>

select distinct *{

    values ?university {
        <https://data.ec2u.eu/universities/linz>
    }

    ?lll a schema:Course ;
        schema:audience "Lifelong Learner" ;
        ec2u:university ?university ;
        schema:name ?name .

    filter (lang(?name) ='en')

    ?courses a schema:Course ;
        ec2u:university ?university ;
        schema:name ?name .

    filter (str(?lll) <= str(?courses))

}