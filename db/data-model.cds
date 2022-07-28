namespace mailservice;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity mailrequests : cuid, managed {
    sender : String;
    recipient : String;
    subject : String;
    type: String;
    body : String;
    attachments : Composition of many Attachments on attachments.parent = $self;
    status : String(1);
    message: String;
    virtual sendHidden        : Boolean;
    virtual statusCriticality : Integer;
}

entity Attachments : cuid, managed {
    key parent       : Association to mailrequests;
        name         : String(200);
        contentType  : String(30);
        contentBytes : LargeString; // content bytes encoded in Base64
}

entity whitelists : cuid, managed {
    addressArea : String;
}

type multirecipient {
    sender : String;
    multiRecipient : many {
        email : String;
    };
    subject : String;
    type: String;
    body : String;
    attachments : many {
        name : String(200);
        contentType : String(30);
        contentBytes : LargeString;
    }
}

type apiReturn {
    statusCode : String(3);
    message : String;
}