using {sap.capire.darpan as db} from '../db/schema.cds';

service DarpanService {

    entity Files @(restrict : [
        {
            grant : [
                'READ',
                'WRITE'
            ],
            to    : 'admin'
        },
        {
            grant : 'READ',
            to    : 'user'
        },
    ]) as projection on db.Files;


    entity Albums @(restrict : [
        {
            grant : [
                'READ',
                'WRITE'
            ],
            to    : 'admin'
        },
        {
            grant : 'READ',
            to    : 'user'
        },
    ]) as projection on db.Albums;

    entity Media_Album_Link @(restrict : [
        {
            grant : [
                'READ',
                'WRITE'
            ],
            to    : 'admin'
        },
        {
            grant : 'READ',
            to    : 'user'
        },
    ]) as projection on db.Media_Album_Link;

    action Import @(requires : 'admin')(folder : String);
    action Reindex @(requires : 'admin')(hashes : many String(32));
    action DeletePermanently @(requires : 'admin')(hashes : many String(32));
    function GetImportFolders() returns array of String;

    function SearchPlaces(query : String(255), at : String(64)) returns array of {
        name    : String(64);
        address : String(255);
        latRef  : String(1);
        lat     : String(32);
        longRef : String(1);
        lon     : String(32);
    };
}
