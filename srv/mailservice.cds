using mailservice as ms from '../db/data-model';

service ms_adminService {
    @requires                : 'EmailServiceAdmin'
    @path                    : '/admin'
    @Capabilities.Insertable : true
    entity mailrequests as projection on ms.mailrequests

                                                        // action -> POST, parameter in application/json
                                                        // function -> GET, parameter in URL
                                                        // bound -> with keys
                                                        // unbound -> general

                        actions {
        action sendmail();
    }

    entity attachments  as projection on ms.Attachments
    entity whitelists as projection on ms.whitelists;

}

service APIService
{
    @requires : 'system-user'
    @path     : '/mail-api'
    @insertonly
    entity mailrequests as projection on ms.mailrequests;
    @insertonly
    entity attachments  as projection on ms.Attachments
    @readonly
    entity whitelists as projection on ms.whitelists;
    action mass_email (mailrequests: ms.multirecipient);
}
