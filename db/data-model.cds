namespace mailservice;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity mailrequests : cuid, managed {
    sender : String;
    recipient : String;
    subject : String;
    body : String;
    attachments : Composition of many Attachments on attachments.parent = $self;
    status : String(1) default 'O';
    virtual sendHidden        : Boolean;
    virtual statusCriticality : Integer;
}

entity Attachments : cuid, managed {
    key parent       : Association to mailrequests;
        name         : String(200);
        contentType  : String(30);
        contentBytes : LargeString; // content bytes encoded in Base64
}