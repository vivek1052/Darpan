using {
    cuid,
    managed
} from '@sap/cds/common';

namespace sap.capire.darpan;

entity Files : managed {
    key hash              : String(32);
        name              : String(128);
        path              : String(255);
        description       : String(255);
        takenDateTime     : Timestamp;
        takenDate         : Date;
        takenMonth        : String(7);
        format            : String(8);
        mimeType          : String(32);
        size              : Integer;
        dimensions        : {
            orientation   : Integer;
            width_actual  : Integer;
            height_actual : Integer;
            width_orient  : Integer;
            height_orient : Integer;
        };
        duration          : Decimal;
        make              : String(64);
        model             : String(64);
        gps               : {
            latitudeRef   : String(1);
            latitude      : Decimal;
            longitudeRef  : String(1);
            longitude     : Decimal;
            altitudeRef   : Decimal;
            altitude      : Decimal;
        };
        address           : {
            label         : String(255);
            houseNumber   : String(32);
            postalCode    : String(32);
            subblock      : String(64);
            block         : String(64);
            street        : String(64);
            subdistrict   : String(64);
            district      : String(64);
            city          : String(64);
            county        : String(64);
            state         : String(64);
            countryName   : String(64);
        };
        UIpaths           : {
            srcSD         : String(255);
            srcFHD        : String(255);
            srcOriginal   : String(255);
            srcMap        : String(255);
        };
        addressCategories : Composition of many Address_Categories
                                on addressCategories.file = $self;
        deleted           : Boolean;
        albums            : Composition of many Media_Album_Link
                                on albums.file = $self;
}


entity Albums : cuid, managed {
    name        : String(64);
    description : String(255);
    DateTime    : Timestamp;
    files       : Composition of many Media_Album_Link
                      on files.album = $self;
}


entity Address_Categories {
    key file     : Association to Files;
    key category : String(64);
}

entity Media_Album_Link {
    key file  : Association to Files;
    key album : Association to Albums;
}
