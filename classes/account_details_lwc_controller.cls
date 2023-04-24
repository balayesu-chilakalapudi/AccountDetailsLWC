public with sharing class account_details_lwc_controller{
    public account_details_lwc_controller(){
    }


    public class account_details_wrapper{
        @AuraEnabled
        public Opportunity opportunityObj;
        @AuraEnabled
        public String account_status;
        @AuraEnabled
        public String home;
        @AuraEnabled
        public String collector;
        @AuraEnabled
        public String work;
        @AuraEnabled
        public String lien_holder;
        @AuraEnabled
        public String mobile;
        @AuraEnabled
        public String stack;
        @AuraEnabled
        public String vin;
        @AuraEnabled
        public String call_status;
        @AuraEnabled
        public String insurance;
        @AuraEnabled
        public String payment_type;
        @AuraEnabled
        public String status;
        @AuraEnabled
        public String due_date;
        @AuraEnabled
        public String due_amount;
        @AuraEnabled
        public String last_paid_date;
        @AuraEnabled
        public String insurance_status;
        @AuraEnabled
        public String remaining_balance;
        @AuraEnabled
        public String auto_pay_status;
        @AuraEnabled
        public String pay_off;
        @AuraEnabled
        public String repo_status;
        @AuraEnabled
        public String next_pay_date;
        @AuraEnabled
        public String collection_status;
        @AuraEnabled
        public List<PaymentHistory> paymentHistoryList;
        @AuraEnabled
        public Payment_Schedule__c current_payment_schedule;

        public account_details_wrapper(){
            account_status = '';
            home = '';
            collector = '';
            work = '';
            lien_holder = '';
            mobile = '';
            stack = '';
            vin = '';
            call_status = '';
            insurance = '';
            payment_type = '';
            status = '';
            due_date = '';
            due_amount = '';
            last_paid_date = null;
            insurance_status = '';
            remaining_balance = '';
            auto_pay_status = '';
            pay_off = '';
            repo_status = '';
            next_pay_date = '';
            collection_status = '';
        }

    }

    public static Payment_Schedule__c getCurrentPaymentSchedule(String oppId){
        Payment_Schedule__c current_payment_schedule;
        try{
            for (Payment_Schedule__c ps : [select id, Per_day_interest_formula__c, Payment_Collected_Rollup__c, emi__c, Due_Date__c, createddate, balance__c, Per_day_interest__c, Remaining_Principal_Amount__c, Total_Pricipal_amount__c
                                           from payment_schedule__c
                                           where opportunity__c = :oppId
                                           order by Month__c ASC]){
                if (ps.Payment_Collected_Rollup__c < ps.emi__c){
                    current_payment_schedule = ps;
                    break;
                }
            }
        } catch (Exception ex){
            system.debug(ex);
        }
        return current_payment_schedule;
    }

    @AuraEnabled
    public static account_details_wrapper getAccountDetails(String opportunityId, String sort_direction, String fromdate, String todate){
        system.debug('opportunityId:' + opportunityId);
        System.debug('fromdate:' + fromdate);
        system.debug('todate:' + todate);
        account_details_wrapper data_obj = new account_details_wrapper();
        Date fromdateparse;
        Date todateparse;
        if (fromdate != null && fromdate != ''){
            fromdateparse = Date.valueOf(fromdate);
        }
        if (todate != null && todate != ''){
            todateparse = Date.valueOf(todate);
        }
        Opportunity opp;
        String soql_query = 'SELECT Id,Per_day_interest__c,Total_Due__c,New_Stock__c,Remaining_Balance__c, owner.name, BQL_Account_Status__c, Collector_Name__c, Home_phone__c, Work_Phone__c, Card_Holder_First_Name__c, State__c, VIN__c, Zivo_Account_Status__c, Zivo_Current_Insurance_Name__c, Payment_Frequency__c, StageName, CloseDate, Total_Amount__c, Cell_phone__c, Last_Payment_Date__c, BQL_Remaining_Payment__c, Pay_Off__c, Next_Due_Date__c, AutoUpdate__c, Zivo_Repo_Reason__c, Closed__c' + 
                            ',Repo_Status__c,Repo_Reason__c,RTC_Date__c,RTC_Sent__c,Collateral_Status__c,Location__c,Repo_Company__c,Repo_Fees__c,Out_for_Repo_Date__c,Repo_Date__c,Hold_Status__c,Days_on_Hold__c,Charge_Off_Date__c,Bad_Debt_Amount__c,Principal_Bad_Debt__c,Repo_Note__c' + 
                            ',(select id,Principal_Paid__c,Paid_Amounts_Principal__c,per_day_interest__c,Payment_Schedule__r.Name,Payment_Schedule__r.Remaining_Principal_Amount__c, Client_Name__r.Laon_Amount_Requested__c, name, Client_Name__c, Payment_Schedule__c, EMI_Amount__c, Interest_due__c,Interest_Paid__c, Principal_due__c, Late_Fees_Due__c, Balance__c,Method__c,Effective_Date__c,Due_Date__c,Payment_Schedule__r.Number_Of_Payment_Histories__c,payment_schedule__r.Balance__c,total_paid__c,Remaining_Principal_Amount__c' + 
                            ' from Payment_Histories__r';
        if (fromdateparse != null && todateparse != null){
            soql_query += ' Where (Effective_Date__c>=:fromdateparse AND Effective_Date__c<=:todateparse)';
        }
        soql_query += ' order by createddate ASC),' +  //soql_query += ' order by Effective_Date__c ' + sort_direction + '),' +
        '(select Id,Month_Name__c,Per_day_interest_formula__c,name,Month__c,due_date__c,start_date__c,Balance__c,Payment_Collected_Rollup__c,Emi__c,Interest_Due__c,Total_Pricipal_amount__c,Remaining_Principal_Amount__c,Monthly_Principal_amount__c,per_day_interest__c,perdayinterest__c,Rate_of_interest__c' + 
                       ' from Payment_Schedules__r)' + 
                       ' from Opportunity WHERE Id =:opportunityId';
        /* if(sort_direction.equals('latest')){
         opp= [SELECT Id,Remaining_Balance__c, owner.name, BQL_Account_Status__c, Collector_Name__c, Home_phone__c, Work_Phone__c, Card_Holder_First_Name__c, State__c, VIN__c, Zivo_Account_Status__c, Zivo_Current_Insurance_Name__c, Payment_Frequency__c, StageName, CloseDate, Total_Amount__c, Cell_phone__c, Last_Payment_Date__c, BQL_Remaining_Payment__c, Pay_Off__c, Next_Due_Date__c, AutoUpdate__c, Zivo_Repo_Reason__c, Closed__c
         ,(select id,Paid_Amounts_Principal__c,per_day_interest__c,Payment_Schedule__r.Name, Client_Name__r.Laon_Amount_Requested__c, name, Client_Name__c, Payment_Schedule__c, EMI_Amount__c, Interest_due__c,Interest_Paid__c, Principal_due__c, Late_Fees_Due__c, Balance__c,Method__c,Effective_Date__c,Due_Date__c,Payment_Schedule__r.Number_Of_Payment_Histories__c,payment_schedule__r.Balance__c,total_paid__c,Remaining_Principal_Amount__c
         from Payment_Histories__r order by Effective_Date__c DESC),
         (select Id, name,Month__c,due_date__c,start_date__c,Balance__c,Payment_Collected_Rollup__c,Emi__c,Interest_Due__c,Total_Pricipal_amount__c,Remaining_Principal_Amount__c,Monthly_Principal_amount__c,per_day_interest__c,perdayinterest__c,
         Rate_of_interest__c
         from Payment_Schedules__r)
         from Opportunity
         WHERE Id = :opportunityId];
         }else{
         opp= [SELECT Id,Remaining_Balance__c, owner.name, BQL_Account_Status__c, Collector_Name__c, Home_phone__c, Work_Phone__c, Card_Holder_First_Name__c, State__c, VIN__c, Zivo_Account_Status__c, Zivo_Current_Insurance_Name__c, Payment_Frequency__c, StageName, CloseDate, Total_Amount__c, Cell_phone__c, Last_Payment_Date__c, BQL_Remaining_Payment__c, Pay_Off__c, Next_Due_Date__c, AutoUpdate__c, Zivo_Repo_Reason__c, Closed__c
         ,(select id,Paid_Amounts_Principal__c,per_day_interest__c,Payment_Schedule__r.Name, Client_Name__r.Laon_Amount_Requested__c, name, Client_Name__c, Payment_Schedule__c, EMI_Amount__c, Interest_due__c,Interest_Paid__c, Principal_due__c, Late_Fees_Due__c, Balance__c,Method__c,Effective_Date__c,Due_Date__c,Payment_Schedule__r.Number_Of_Payment_Histories__c,payment_schedule__r.Balance__c,total_paid__c,Remaining_Principal_Amount__c
         from Payment_Histories__r order by Effective_Date__c ASC)
         from Opportunity
         WHERE Id = :opportunityId];
         }*/
        system.debug('soql_query:' + soql_query);
        for (Opportunity oppObj : Database.query(soql_query)){
            opp = oppObj;
            break;
        }
        data_obj.opportunityObj = opp;
        if (opp.BQL_Account_Status__c != null){
            data_obj.account_status = opp.BQL_Account_Status__c;
        }
        if (opp.Collector_Name__c != null){
            data_obj.collector = opp.Collector_Name__c;
        }
        if (opp.Home_phone__c != null){
            data_obj.home = opp.Home_phone__c;
        }
        if (opp.Work_Phone__c != null){
            data_obj.work = opp.Work_Phone__c;
        }
        if (opp.Card_Holder_First_Name__c != null){
            data_obj.lien_holder = opp.Card_Holder_First_Name__c;
        }
        if (opp.Cell_phone__c != null){
            data_obj.mobile = opp.Cell_phone__c;
        }
        if (opp.New_Stock__c != null){
            data_obj.stack = opp.New_Stock__c;
        }
        if (opp.VIN__c != null){
            data_obj.vin = opp.VIN__c;
        }
        if (opp.Zivo_Account_Status__c != null){
            data_obj.call_status = opp.Zivo_Account_Status__c;
        }
        if (opp.Zivo_Current_Insurance_Name__c != null){
            data_obj.insurance = opp.Zivo_Current_Insurance_Name__c;
        }
        if (opp.Payment_Frequency__c != null){
            data_obj.payment_type = opp.Payment_Frequency__c;
        }
        if (opp.StageName != null){
            data_obj.status = opp.StageName;
        }
        
        /*if (opp.CloseDate != null){
         data_obj.due_date = (opp.CloseDate).format();
         }
         if (opp.Total_Amount__c != null){
         data_obj.due_amount = '' + opp.Total_Amount__c;
         }*/
        /*if (opp.Last_Payment_Date__c != null){
         data_obj.last_paid_date = (opp.Last_Payment_Date__c).format();
         }*/
        Payment_History__c latest_payment_history;
        Payment_Schedule__c current_payment_schedule = getCurrentPaymentSchedule(opp.Id);
        data_obj.current_payment_schedule = current_payment_schedule;
        try{
            latest_payment_history = [SELECT createddate,Effective_Date__c, due_date__c, Remaining_Principal_Amount__c
                                      from payment_history__c
                                      where Client_Name__c = :opp.Id
                                      order by Effective_Date__c desc
                                      limit 1];
            if (latest_payment_history != null){
                data_obj.last_paid_date = Date.valueOf(latest_payment_history.Effective_Date__c).format();
                /* if (latest_payment_history.due_date__c != null){
                 data_obj.due_date = (Date.valueOf(latest_payment_history.createddate)).format();
                 }
                 if (latest_payment_history.Remaining_Principal_Amount__c != null){
                 data_obj.due_amount = '' + latest_payment_history.Remaining_Principal_Amount__c;
                 }*/
                 //(Today - Last payment date )* per day interest
                 Date lastpaymentdate=Date.valueOf(latest_payment_history.Effective_Date__c);
                 system.debug('lastpaymentdate:'+lastpaymentdate);
                 system.debug('today:'+(system.today()));
                 integer daysdifference=Math.abs(((system.today()).daysBetween(lastpaymentdate)));
                 system.debug('daysdifference:'+daysdifference);
                 data_obj.pay_off=''+(daysdifference*opp.Per_day_interest__c);
                 opp.Pay_Off__c=data_obj.pay_off;
                 update opp;
                }
            /* if(current_payment_schedule.Due_Date__c!=null){
             data_obj.due_date=(current_payment_schedule.Due_Date__c).format();
             }*/
            //opp.Payment_Histories__r.get(opp.Payment_Histories__r.size() - 1).Effective_Date__c;
        } catch (Exception ex){
            system.debug(ex);
        }
        if (opp.Remaining_Balance__c != null){
            data_obj.remaining_balance = '$' + opp.Remaining_Balance__c;
        }
       /* if (opp.Pay_Off__c != null){
            data_obj.pay_off = opp.Pay_Off__c;
        }*/
        if (current_payment_schedule.Due_Date__c != null){
            data_obj.next_pay_date = (current_payment_schedule.Due_Date__c).format();
            data_obj.due_date = (current_payment_schedule.Due_Date__c).format();
            //(opp.Next_Due_Date__c).format();
        }
        if (current_payment_schedule != null){
            data_obj.due_amount = '' + current_payment_schedule.balance__c;
        }
        if (opp.BQL_Account_Status__c != null){
            data_obj.insurance_status = opp.BQL_Account_Status__c;
        }
        if (opp.AutoUpdate__c != null){
            data_obj.auto_pay_status = String.valueOf(opp.AutoUpdate__c);
        }
        if (opp.Zivo_Repo_Reason__c != null){
            data_obj.repo_status = opp.Zivo_Repo_Reason__c;
        }
        if (opp.Closed__c != null){
            data_obj.collection_status = opp.Closed__c;
        }
        system.debug('data_obj:' + data_obj);
        List<PaymentHistory> phlist = new List<PaymentHistory>();
        integer pmt_counter = 1;
        decimal prev_paid_principal = null;
        decimal prev_due_principal = null;
        decimal pre_balance_balafter = null;
        boolean intial_payment = false;
        decimal opp_remaining_balance = opp.total_due__c;
        decimal prev_paid_amount = 0;
        for (Payment_History__c payHistory : opp.Payment_Histories__r){
            PaymentInfo paymentinfoObj = new PaymentInfo();
            DueAmounts dueAmountsObj = new DueAmounts();
            PaidAmounts paidAmountsObj = new PaidAmounts();
            BalanceAmounts balanceAmountsObj = new BalanceAmounts();
            paymentinfoObj.type = payHistory.Method__c;
            paymentinfoObj.paid = payHistory.Effective_Date__c;
            paymentinfoObj.due = payHistory.Due_Date__c;
            if (payHistory.per_day_interest__c != null){
                dueAmountsObj.interest = payHistory.Interest_Due__c;
            } else{
                dueAmountsObj.interest = 0;
            }
            if (payHistory.Interest_Paid__c != null){
                paidAmountsObj.i = payHistory.Interest_Paid__c;
            }
            paymentinfoObj.pmt = pmt_counter++;
            paymentinfoObj.pmtschedule = payHistory.Payment_Schedule__r.Name;
            paymentinfoObj.period = payHistory.Payment_Schedule__r.Number_Of_Payment_Histories__c;
            integer past_difference = 0;
            if (payHistory.Due_Date__c > system.today()){
                past_difference = (system.today()).daysBetween(payHistory.Due_Date__c);
            }
            paymentinfoObj.past = past_difference + ' Days';

            //princial calculation
            paidAmountsObj.principal = payHistory.Principal_Paid__c;
            //payHistory.Paid_Amounts_Principal__c;

            paidAmountsObj.total = payHistory.Total_Paid__c;
            paidAmountsObj.d = 0;
            //payHistory.Remaining_Principal_Amount__c;
            if (!intial_payment){
                intial_payment = true;
                // balanceAmountsObj.balafter = payHistory.payment_schedule__r.Remaining_Principal_Amount__c;
                //payHistory.payment_schedule__r.Balance__c;
                dueAmountsObj.principal = payHistory.Principal_Due__c;
                //(balanceAmountsObj.balafter+PaidAmountsObj.principal);
                prev_due_principal = dueAmountsObj.principal;
            } else{
                // balanceAmountsObj.balafter = payHistory.payment_schedule__r.Remaining_Principal_Amount__c;
                //prev_due_principal;
                dueAmountsObj.principal = payHistory.Principal_Due__c;
                //(balanceAmountsObj.balafter+PaidAmountsObj.principal);
                prev_due_principal = dueAmountsObj.principal;
            }
            balanceAmountsObj.balafter = opp_remaining_balance - (prev_paid_amount + payHistory.total_paid__c);
            prev_paid_amount += payHistory.total_paid__c;
            balanceAmountsObj.stilldue = payHistory.Remaining_Principal_Amount__c;
            dueAmountsObj.total = dueAmountsObj.interest + dueAmountsObj.principal;

            if (payHistory.Principal_Due__c != null){
                dueAmountsObj.principal = (payHistory.Principal_Due__c).setScale(2);
            } else{
                dueAmountsObj.principal = 0;
            }

            if (dueAmountsObj.total != null){
                dueAmountsObj.total = (dueAmountsObj.total).setScale(2);
            } else{
                dueAmountsObj.total = 0;
            }

            //balanceAmountsObj.balafter
            if (balanceAmountsObj.balafter != null){
                balanceAmountsObj.balafter = (balanceAmountsObj.balafter).setScale(2);
            } else{
                balanceAmountsObj.balafter = 0;
            }
            //balanceAmountsObj.stilldue
            if (balanceAmountsObj.stilldue != null){
                balanceAmountsObj.stilldue = (balanceAmountsObj.stilldue).setScale(2);
            } else{
                balanceAmountsObj.stilldue = 0;
            }


            PaymentHistory ph = new PaymentHistory();
            ph.paymentDate = payHistory.Effective_Date__c;
            ph.PaymentHistoryId = payHistory.Id;
            ph.paymentinfoObj = paymentinfoObj;
            ph.dueAmountsObj = dueAmountsObj;
            ph.paidAmountsObj = paidAmountsObj;
            ph.balanceAmountsObj = balanceAmountsObj;
            ph.sortBy = sort_direction;
            phlist.add(ph);
            phlist.sort ();
        }
        data_obj.paymentHistoryList = phlist;
        return data_obj;
    }

    public class PaymentHistory implements Comparable{
        @AuraEnabled
        public String PaymentHistoryId;
        @AuraEnabled
        public PaymentInfo paymentinfoObj;
        @AuraEnabled
        public DueAmounts dueAmountsObj;
        @AuraEnabled
        public PaidAmounts paidAmountsObj;
        @AuraEnabled
        public BalanceAmounts balanceAmountsObj;
        @AuraEnabled
        public Date paymentDate;
        @AuraEnabled
        public String sortBy;
        public Integer compareTo(Object compareTo){
            PaymentHistory compareToDoc = (PaymentHistory)compareTo;
            if (paymentDate == compareToDoc.paymentDate)
                return 0;
            if (sortBy.equals('ASC')){
                if (paymentDate < compareToDoc.paymentDate)
                    return  - 1;
            } else{
                if (paymentDate > compareToDoc.paymentDate)
                    return  - 1;
            }
            return 1;
        }

    }

    public class PaymentInfo{
        @AuraEnabled
        public String type;
        @AuraEnabled
        public Date paid;
        @AuraEnabled
        public Integer pmt;
        @AuraEnabled
        public Date due;
        @AuraEnabled
        public Decimal period;
        @AuraEnabled
        public String past;
        @AuraEnabled
        public String pmtschedule;
    }

    public class DueAmounts{
        @AuraEnabled
        public Decimal d = 0;
        @AuraEnabled
        public Decimal l;
        @AuraEnabled
        public Decimal principal;
        @AuraEnabled
        public Decimal o;
        @AuraEnabled
        public Decimal interest;
        @AuraEnabled
        public Decimal sn;
        @AuraEnabled
        public Decimal total;
    }

    public class PaidAmounts{
        @AuraEnabled
        public Decimal d;
        @AuraEnabled
        public Decimal l;
        @AuraEnabled
        public Decimal principal;
        @AuraEnabled
        public Decimal o;
        @AuraEnabled
        public Decimal i;
        @AuraEnabled
        public Decimal sn;
        @AuraEnabled
        public Decimal total;
    }

    public class BalanceAmounts{
        @AuraEnabled
        public Decimal balafter;
        @AuraEnabled
        public Decimal stilldue;
    }

    @AuraEnabled
    public static void savePaymentHistory(String strData){
        try{
            Payment_History__c payObj = (Payment_History__c)JSON.Deserialize(strData, Payment_History__c.class);
            system.debug('payObj:' + payObj);
            insert payObj;
            Payment_Schedule__c psObj = [SELECT Id, Remaining_Principal_Amount__c, Balance__c
                                         From Payment_Schedule__c
                                         WHERE Id = :payObj.Payment_Schedule__c];
            psObj.Remaining_Principal_Amount__c = payObj.Remaining_Principal_Amount__c;
            update psObj;
        } catch (Exception ex){
            system.debug(ex + '\n' + ex.getStackTraceString());
            throw new AuraHandledException(ex + '\n' + ex.getStackTraceString());
        }
    }

    @AuraEnabled
    public static void saveRepoDetails(String strData){
        try{
            Opportunity oppObj = (Opportunity) JSON.deserialize(strData, Opportunity.class);
            update oppObj;
            //send email to opportunity owner
            List<Messaging.SingleEmailMessage> mails = new List<Messaging.SingleEmailMessage>();

            for (Opportunity opp : [select owner.email, owner.firstname
                                    from Opportunity
                                    where id = :oppObj.Id]){
                if (opp.owner.Email != null && opp.owner.FirstName != null){
                    // Step 1: Create a new Email
                    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();

                    // Step 2: Set list of people who should get the email
                    List<String> sendTo = new List<String>();
                    sendTo.add(opp.owner.Email);
                    mail.setToAddresses(sendTo);

                    // Step 3: Set who the email is sent from
                    //mail.setReplyTo('');
                    mail.setSenderDisplayName('Dealer Center');

                    // (Optional) Set list of people who should be CC'ed
                    List<String> ccTo = new List<String>();
                    // ccTo.add('business@bankofnigeria.com');
                    mail.setCcAddresses(ccTo);

                    // Step 4. Set email contents - you can use variables!
                    mail.setSubject('Opportunity Stage Changed');
                    String body = 'Dear ' + opp.owner.FirstName + ', ';
                    body += 'Now the stage on opportunity has changed to Repossession Process';
                    mail.setHtmlBody(body);

                    // Step 5. Add your email to the master list
                    mails.add(mail);
                }
            }
            // Step 6: Send all emails in the master list
            Messaging.sendEmail(mails);
        } catch (Exception ex){
            throw new AuraHandledException(ex + '\n' + ex.getStackTraceString());
        }
    }
    @AuraEnabled
    public static void deleteRecentPayment(String opportunityId){
        try {
            Payment_History__c recentPayment=[SELECT Id FROM Payment_History__c
            WHERE Client_Name__c=:opportunityId
            ORDER BY CreatedDate DESC
            LIMIT 1];
            delete recentPayment;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}