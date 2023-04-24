import { LightningElement, api, track } from 'lwc';
import modal from "@salesforce/resourceUrl/custommodal";
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from "lightning/actions";
import { loadStyle } from "lightning/platformResourceLoader";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getData from "@salesforce/apex/account_details_lwc_controller.getAccountDetails";
import savePayment from "@salesforce/apex/account_details_lwc_controller.savePaymentHistory";
import saveRepoOpportunityDetails from "@salesforce/apex/account_details_lwc_controller.saveRepoDetails";
import deleteRecentPaymentHandler from "@salesforce/apex/account_details_lwc_controller.deleteRecentPayment";

export default class Account_details_lwc extends NavigationMixin(LightningElement) {
    @api recordId;
    @track data_obj = [];
    @track paymentHistoryList = [];
    @track sort_direction = 'DESC';
    @track repo_opportunity_obj = {
        'sObjectType': 'Opportunity',
        'Repo_Reason__c': '',
    };
    connectedCallback() {
        console.log('recordId:' + this.recordId);
        loadStyle(this, modal);
    }

    recordId_rendered = false;
    renderedCallback() {
        if (!this.recordId_rendered &&
            this.recordId != undefined) {
            console.log(this.recordId + ' is provided');
            this.recordId_rendered = true;
            this.repo_opportunity_obj.Id = this.recordId;
            this.retrieveData();
        }
    }


    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    account_condition_picklist_value = 'Date Added';

    get account_condition_picklist_options() {
        return [
            { label: 'Date Added', value: 'Date Added' },
            { label: 'In Progress', value: 'inProgress' },
            { label: 'Finished', value: 'finished' },
        ];
    }

    handleChange(event) {
        this.value = event.detail.value;
    }

    payment_schedule_picklist_options = [];
    payment_schedule_picklist_value = 'Select';
    account_status = '';
    current_payment_schedule;
    retrieveData() {
        getData({ opportunityId: this.recordId, sort_direction: this.sort_direction, fromdate: this.fromdate_filter, todate: this.todate_filter })
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.data_obj = result;
                this.paymentHistoryList = this.data_obj.paymentHistoryList;
                this.repo_opportunity_obj.stageName = this.data_obj.opportunityObj.stageName;
                this.repo_opportunity_obj.Repo_Status__c = this.data_obj.opportunityObj.Repo_Status__c;
                this.repo_opportunity_obj.Repo_Reason__c = this.data_obj.opportunityObj.Repo_Reason__c;
                this.repo_opportunity_obj.RTC_Date__c = this.data_obj.opportunityObj.RTC_Date__c;
                this.repo_opportunity_obj.RTC_Sent__c = this.data_obj.opportunityObj.RTC_Sent__c;
                this.repo_opportunity_obj.Collateral_Status__c = this.data_obj.opportunityObj.Collateral_Status__c;
                this.repo_opportunity_obj.Location__c = this.data_obj.opportunityObj.Location__c;
                this.repo_opportunity_obj.Repo_Company__c = this.data_obj.opportunityObj.Repo_Company__c;
                this.repo_opportunity_obj.Repo_Fees__c = this.data_obj.opportunityObj.Repo_Fees__c;
                this.repo_opportunity_obj.Out_for_Repo_Date__c = this.data_obj.opportunityObj.Out_for_Repo_Date__c;
                this.repo_opportunity_obj.Repo_Date__c = this.data_obj.opportunityObj.Repo_Date__c;
                this.repo_opportunity_obj.Hold_Status__c = this.data_obj.opportunityObj.Hold_Status__c;
                this.repo_opportunity_obj.Days_on_Hold__c = this.data_obj.opportunityObj.Days_on_Hold__c;
                this.repo_opportunity_obj.Charge_Off_Date__c = this.data_obj.opportunityObj.Charge_Off_Date__c;
                this.repo_opportunity_obj.Bad_Debt_Amount__c = this.data_obj.opportunityObj.Bad_Debt_Amount__c;
                this.repo_opportunity_obj.Principal_Bad_Debt__c = this.data_obj.opportunityObj.Principal_Bad_Debt__c;
                this.repo_opportunity_obj.Repo_Note__c = this.data_obj.opportunityObj.Repo_Note__c;
                if (this.data_obj.account_status != null) {
                    this.account_status = this.data_obj.account_status;
                }
                //populate payment schedule picklist
                if (this.data_obj.opportunityObj.Payment_Schedules__r != null) {
                    for (let x of this.data_obj.opportunityObj.Payment_Schedules__r) {
                        this.payment_schedule_picklist_options.push({ label: x.Month_Name__c, value: x.Id });
                    }
                }
                this.payment_schedule_picklist_value = this.data_obj.current_payment_schedule.Id;
                this.current_payment_schedule = this.data_obj.current_payment_schedule;
                console.log('current_payment_schedule:' + JSON.stringify(this.current_payment_schedule));
                this.latestPaidDate=this.data_obj.last_paid_date;
                this.payoff=this.data_obj.pay_off;
                this.handlePaymentScheduleChange(null);
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.data_obj = undefined;
                console.log('error setting default', error);
            });
    }

    handleSort(event) {
        this.sort_direction = event.target.value;
        console.log('sort_direction:' + this.sort_direction);
        this.retrieveData();
    }
    isShowTakePaymentModal = false;
    @track paymentscheduleObj = {};
    @track paymentHistoryModal = {};

    handleTakePaymentClick(event) {
        //  this.payment_schedule_picklist_value=null;
        this.paymentHistoryModal = {};
        // this.paymentscheduleObj={};
        this.isShowTakePaymentModal = true;
    }
    hideTakePaymentModalBox(event) {

        this.isShowTakePaymentModal = false;
    }

    handlePaymentScheduleChange(event) {
        try {
            console.log('payment_schedule_picklist_value:' + this.payment_schedule_picklist_value);
            this.paymentHistoryModal.Total_Paid__c = 0;
            //  this.payment_schedule_picklist_value = event.detail.value;
            for (let x of this.data_obj.opportunityObj.Payment_Schedules__r) {
                if (x.Id === this.payment_schedule_picklist_value) {
                    this.paymentscheduleObj = x;
                    if (this.paymentscheduleObj.perdayinterest__c == undefined && x.Per_day_interest__c != null) {
                        this.paymentscheduleObj.perdayinterest__c = x.Per_day_interest__c;
                    }
                    if (this.paymentscheduleObj.Remaining_Principal_Amount__c == undefined && x.Total_Pricipal_amount__c != null) {
                        this.paymentscheduleObj.Remaining_Principal_Amount__c = x.Total_Pricipal_amount__c;
                    }
                    if (this.paymentscheduleObj.perdayinterest__c != null) {
                        let perdayinterest = this.paymentscheduleObj.perdayinterest__c;
                        this.paymentscheduleObj.perdayinterest__c = perdayinterest;
                        //parseFloat(perdayinterest).toFixed(2);
                    }
                    if (this.paymentscheduleObj.Remaining_Principal_Amount__c != null) {
                        let rembal = this.paymentscheduleObj.Remaining_Principal_Amount__c;
                        this.paymentscheduleObj.Remaining_Principal_Amount__c = rembal;
                        //parseFloat(rembal).toFixed(2);
                    }
                    break;
                }
            }
            console.log('paymentscheduleObj:' + JSON.stringify(this.paymentscheduleObj));
        } catch (err) {
            console.log('Exception:' + err.stack);
        }
    }
    readMethod(event) {
        this.paymentHistoryModal.Method__c = event.target.value;
    }
    latest_paid_date=null;
    readEffectiveDate(event) {
        try {
            this.paymentHistoryModal.Effective_Date__c = event.target.value;
            if (this.paymentHistoryModal.Effective_Date__c > this.paymentscheduleObj.Start_Date__c) {
                //check for existing effective date
                let matchfound = false;
                console.log('this.data_obj.paymentHistoryList:' + JSON.stringify(this.data_obj.paymentHistoryList));
                if (this.data_obj.opportunityObj.Payment_Histories__r != null) {
                    for (let x of this.data_obj.opportunityObj.Payment_Histories__r) {
                        if (this.paymentHistoryModal.Effective_Date__c <= x.Effective_Date__c) {
                            const evt = new ShowToastEvent({
                                title: "Already Taken",
                                message: "Interest is already charged for this date",
                                variant: "warning",
                            });
                            this.dispatchEvent(evt);
                            this.paymentHistoryModal.Effective_Date__c = null;
                            matchfound = true;
                            break;
                        }
                    }
                }
                if (!matchfound) {
                    let date2value = this.paymentscheduleObj.Start_Date__c;
                    if (this.latest_paid_date == null && this.data_obj.opportunityObj.Payment_Histories__r != null) {
                        this.latest_paid_date=this.data_obj.opportunityObj.Payment_Histories__r[0].Effective_Date__c;
                        
                        for (let x of this.data_obj.opportunityObj.Payment_Histories__r) {
                            console.log('this.paymentscheduleObj.Id:'+this.paymentscheduleObj.Id);
                            console.log('this.latest_paid_date:'+this.latest_paid_date);
                            console.log('x.Effective_Date__c:'+x.Effective_Date__c);
                            console.log('x.Payment_Schedule__c:'+x.Payment_Schedule__c);
                            if (this.latest_paid_date < x.Effective_Date__c &&
                                x.Payment_Schedule__c == this.paymentscheduleObj.Id) {
                                this.latest_paid_date = x.Effective_Date__c;
                                console.log('this.latest_paid_date:'+this.latest_paid_date);
                            }
                        }                        
                    }
                    if (this.latest_paid_date != null) {
                        date2value = this.latest_paid_date;
                    }
                    var date1 = new Date(this.paymentHistoryModal.Effective_Date__c);
                    var date2 = new Date(date2value);
                    console.log('date2:'+date2);
                    //new Date(this.paymentscheduleObj.Start_Date__c);
                    var Difference_In_Time = date1.getTime() - date2.getTime();
                    // To calculate the no. of days between two dates
                    var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
                    console.log('Difference_In_Days:' + Difference_In_Days);
                    this.paymentHistoryModal.Number_of_days__c = Difference_In_Days;
                    console.log('paymentHistoryModal' + JSON.stringify(this.paymentHistoryModal));
                    this.calculateStats();
                    //hide below columns when total paid not entered
                    this.paymentHistoryModal.Interest_Paid__c = '';
                    this.paymentHistoryModal.Principal_Paid__c = '';
                    this.paymentHistoryModal.Remaining_Principal_Amount__c = '';
                    this.paymentHistoryModal.per_day_interest__c = '';
                    // this.paymentHistoryModal.Principal_Due__c='';
                }
            } else {
                const evt = new ShowToastEvent({
                    title: "Effective Date is Start Date",
                    message: "Please Select Effective Date Older than Start Date",
                    variant: "warning",
                });
                this.dispatchEvent(evt);
                this.paymentHistoryModal.Effective_Date__c = null;
            }
        } catch (err) {
            console.log('Exception:' + err.stack);
        }
    }


    readStartDate(event) {
        this.paymentHistoryModal.Start_Date__c = event.target.value;
        try {
            //   this.calculateStats();
        } catch (err) {
            console.log(err.stack);
        }
    }
    readTotalPaid(event) {
        this.paymentHistoryModal.Total_Paid__c = event.target.value;
        if (this.paymentHistoryModal.Total_Paid__c > this.paymentscheduleObj.Balance__c) {
            this.paymentHistoryModal.Total_Paid__c=null;
            const evt = new ShowToastEvent({
                title: "Total Paid Exceeded.",
                message: "Please Enter the value less than the 	Total Due value",
                variant: "warning",
            });
            this.dispatchEvent(evt);
        } else {
            try {
                this.calculateStats();
            } catch (err) {
                console.log(err.stack);
            }
        }
    }
    principaldueamt = 0;
    calculateStats() {
        let total_paid = this.paymentHistoryModal.Total_Paid__c;
        let number_of_days = this.paymentHistoryModal.Number_of_days__c;
        let per_day_interest = this.current_payment_schedule.Per_day_interest_formula__c;
        //this.paymentscheduleObj.perdayinterest__c;
        console.log('total_paid:' + total_paid);
        console.log('number_of_days:' + number_of_days);
        console.log('per_day_interest:' + per_day_interest);
        this.paymentHistoryModal.Principal_Paid__c = parseFloat(total_paid - (per_day_interest * number_of_days)).toFixed(2);
        this.paymentHistoryModal.Interest_Due__c = parseFloat(per_day_interest * number_of_days).toFixed(2);

        let Remaining_Principal_Amount = this.paymentscheduleObj.Remaining_Principal_Amount__c;
        //parseFloat(this.paymentscheduleObj.Remaining_Principal_Amount__c).toFixed(2);
        let Principal_Paid = this.paymentHistoryModal.Principal_Paid__c;
        //parseFloat(this.paymentHistoryModal.Principal_Due__c).toFixed(2);
        let Rate_of_interest = this.paymentscheduleObj.Rate_of_interest__c;
        //parseFloat(this.paymentscheduleObj.Rate_of_interest__c).toFixed(2);

        console.log('Remaining_Principal_Amount:' + Remaining_Principal_Amount);
        console.log('Principal_Paid:' + Principal_Paid);

        this.paymentHistoryModal.Remaining_Principal_Amount__c = parseFloat(parseFloat(this.paymentscheduleObj.Balance__c) - parseFloat(this.paymentHistoryModal.Total_Paid__c)).toFixed(2);
        //parseFloat(Remaining_Principal_Amount-Principal_Paid).toFixed(2);

        let payhis_Remaining_Principal_Amount = this.paymentHistoryModal.Remaining_Principal_Amount__c;
        try {
            let paymentHistoryModal_perdayinterest = (payhis_Remaining_Principal_Amount * Rate_of_interest * 1) / 36500;
            paymentHistoryModal_perdayinterest = paymentHistoryModal_perdayinterest;
            //parseFloat(paymentHistoryModal_perdayinterest).toFixed(2);
            this.paymentHistoryModal.Interest_Paid__c = parseFloat(paymentHistoryModal_perdayinterest * number_of_days).toFixed(2);
            this.paymentHistoryModal.per_day_interest__c = parseFloat(paymentHistoryModal_perdayinterest).toFixed(2);
        } catch (err) {
            console.log(err.stack);
        }
        console.log('paymentHistoryModal' + JSON.stringify(this.paymentHistoryModal));
        this.principaldueamt = parseFloat(this.paymentscheduleObj.Balance__c - this.paymentHistoryModal.Interest_Paid__c).toFixed(2);
        this.paymentHistoryModal.Principal_Due__c = this.principaldueamt;
        if (parseFloat(this.paymentHistoryModal.Total_Paid__c) <= parseFloat(this.paymentHistoryModal.Interest_Due__c)) {
            this.paymentHistoryModal.Interest_Paid__c = this.paymentHistoryModal.Total_Paid__c;
            this.paymentHistoryModal.Principal_Paid__c = 0;
        }
        if (parseFloat(this.paymentHistoryModal.Total_Paid__c) > parseFloat(this.paymentHistoryModal.Interest_Due__c)) {
            this.paymentHistoryModal.Interest_Paid__c = this.paymentHistoryModal.Interest_Due__c;
            this.paymentHistoryModal.Principal_Paid__c = Math.abs(parseFloat(this.paymentHistoryModal.Total_Paid__c) - parseFloat(this.paymentHistoryModal.Interest_Due__c));
        }
        if (this.paymentHistoryModal.Principal_Paid__c != null) {
            this.paymentHistoryModal.Principal_Paid__c = parseFloat(this.paymentHistoryModal.Principal_Paid__c).toFixed(2);
        }
        this.paymentHistoryModal.Principal_Due__c = parseFloat(parseFloat(this.paymentscheduleObj.Balance__c) - parseFloat(this.paymentHistoryModal.Interest_Due__c)).toFixed(2);
    }

    saveTakePaymentModalBox(event) {

        console.log('handleSavePaymentClick');
        //this.show_spinner=true;
        try {
            this.paymentHistoryModal.Payment_Schedule__c = this.paymentscheduleObj.Id;
            this.paymentHistoryModal.Client_Name__c = this.data_obj.opportunityObj.Id;
            this.paymentHistoryModal.EMI_Amount__c = this.paymentHistoryModal.Total_Paid__c;
            this.paymentHistoryModal.Due_Date__c = this.paymentscheduleObj.Due_Date__c;
            console.log('strData' + JSON.stringify(this.paymentHistoryModal));
            savePayment({ strData: JSON.stringify(this.paymentHistoryModal) })
                .then(result => {
                    console.log('result:' + JSON.stringify(result));
                    //  this.data = result;      
                    this.error = undefined;
                    // this.closeAction();
                    const evt = new ShowToastEvent({
                        title: 'Success',
                        message: 'Record Saved!',
                        variant: 'success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    this.isShowTakePaymentModal = false;
                    this.retrieveData();
                    // this.closeAction();
                    //window.open('/'+this.recordId,'_self');
                    // this.show_spinner=false;
                })
                .catch(error => {
                    this.error = error;
                    const evt = new ShowToastEvent({
                        title: 'ERROR',
                        message: '' + JSON.stringify(error),
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
                    this.data = undefined;
                    console.log('error setting default', error);
                    this.show_spinner = false;
                });

        } catch (err) {
            console.log('error:' + err.stack);
        }
    }
    fromdate_filter;
    todate_filter;
    readFromDateFilter(event) {
        this.fromdate_filter = event.target.value;
        console.log('fromdate_filter:' + this.fromdate_filter);
    }
    readToDateFilter(event) {
        this.todate_filter = event.target.value;
        console.log('todate_filter:' + this.todate_filter);
    }
    handleApplyFilterClick(event) {
        this.retrieveData();
    }
    readRepoStatus(event) {
        this.repo_opportunity_obj.Repo_Status__c = event.target.value;
        if (this.repo_opportunity_obj.Repo_Status__c != null && this.repo_opportunity_obj.Repo_Status__c === 'Repossessed') {
            this.repo_opportunity_obj.stageName = 'Repossession Process';
        }
    }
    readRepoReason(event) {
        this.repo_opportunity_obj.Repo_Reason__c = event.target.value;
    }
    readRTCDate(event) {
        console.log('rtcdate:' + event.target.value);
        this.repo_opportunity_obj.RTC_Date__c = event.target.value;
    }
    readRTCSent(event) {
        this.repo_opportunity_obj.RTC_Sent__c = event.target.value;
    }
    readCollateral_Status(event) {
        this.repo_opportunity_obj.Collateral_Status__c = event.target.value;
    }
    readLocation(event) {
        this.repo_opportunity_obj.Location__c = event.target.value;
    }
    readRepo_Company(event) {
        this.repo_opportunity_obj.Repo_Company__c = event.target.value;
    }
    readRepo_Fees(event) {
        this.repo_opportunity_obj.Repo_Fees__c = event.target.value;
    }
    readOut_for_Repo_Date(event) {
        this.repo_opportunity_obj.Out_for_Repo_Date__c = event.target.value;
    }
    readRepo_Date(event) {
        this.repo_opportunity_obj.Repo_Date__c = event.target.value;
    }
    readHold_Status(event) {
        this.repo_opportunity_obj.Hold_Status__c = event.target.value;
    }
    readDays_on_Hold(event) {
        this.repo_opportunity_obj.Days_on_Hold__c = event.target.value;
    }
    readRepo_Note(event) {
        this.repo_opportunity_obj.Repo_Note__c = event.target.value;
    }
    handleRepoSave() {
        console.log('strData' + JSON.stringify(this.repo_opportunity_obj));
        saveRepoOpportunityDetails({ strData: JSON.stringify(this.repo_opportunity_obj) })
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                //  this.data = result;      
                this.error = undefined;
                //this.closeAction();
                const evt = new ShowToastEvent({
                    title: 'Success',
                    message: 'Record Saved!',
                    variant: 'success',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                this.closeAction();
                window.open('/' + this.recordId, '_self');
                // this.show_spinner=false;
            })
            .catch(error => {
                this.error = error;
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                this.data = undefined;
                console.log('error setting default', error);
                this.show_spinner = false;
            });
    }

    // Navigate to View Opportunity Page
    navigateToViewOpportunityPage() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            },
        });
    }

    showCongaSavePrintDialog = false;
    showCongaSavePrintDialog_Header_Title = '';
    templateId = '';

    handlePrintRightToCure() {
        //populate RTC date, RTC sent
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        today = mm + '/' + dd + '/' + yyyy;
        this.repo_opportunity_obj.RTC_Date__c = today;
        this.repo_opportunity_obj.RTC_Sent__c = 'Yes';
        this.templateId = '0T_001UAA941459';
        this.showCongaSavePrintDialog_Header_Title = 'Print Right To Cure';
        this.showCongaSavePrintDialog = true;
        // window.open('/apex/APXTConga4__Conga_Composer?SolMgr=1&serverUrl={!API.Partner_Server_URL_520}&Id='+this.recordId+'&TemplateId=0T_001UAA941459&DefaultPDF=1&DS7=3&AC0=1​​​​');
    }
    handlePrintRepoOrder() {
        /*let print_repo_order_url='/apex/APXTConga4__Conga_Composer?SolMgr=1'+
'&serverUrl={!API.Partner_Server_URL_520}'+
'&Id='+this.recordId+
'&TemplateId=0T_002UAA328463&DefaultPDF=1'+
'&DS7=3&AC0=1';*/
        //window.open(print_repo_order_url);
        this.templateId = '0T_010UAA954722';
        //'0T_002UAA328463';
        this.showCongaSavePrintDialog_Header_Title = 'Print Repo Order';
        this.showCongaSavePrintDialog = true;
    }
    handleVoluntarySurender(){
        this.templateId = '0T_013UAA664749';
        this.showCongaSavePrintDialog_Header_Title = 'Voluntary Surender';
        this.showCongaSavePrintDialog = true;
    }
    handleRightoredeem(){
        this.templateId = '0T_014UAA647621';
        this.showCongaSavePrintDialog_Header_Title = 'Right to redeem';
        this.showCongaSavePrintDialog = true;
    }
    handleChargeOffAcct() {
        /* let charge_off_acct_url='/apex/APXTConga4__Conga_Composer?SolMgr=1'+
     '&serverUrl={!API.Partner_Server_URL_520}'+
 '&Id='+this.recordId+
 '&TemplateId=0T_003UAA805829&DefaultPDF=1&DS7=3&AC0=1';
         window.open(charge_off_acct_url);*/
        this.templateId = '0T_003UAA805829';
        // this.showCongaSavePrintDialog_Header_Title='Charge Off Acct';
        // this.showCongaSavePrintDialog=true;
        this.showChargeOffAcctDialog = true;
    }

    saveCongaDoc(event) {
        //this.showCongaSavePrintDialog=false;
        let recordIdvalue = this.recordId;
        if (this.templateId === '0T_010UAA954722') {
            //payment schedule repo order template is 0T_010UAA954722
            recordIdvalue = this.current_payment_schedule.Id;
        }
        let print_doc_url = '/apex/APXTConga4__Conga_Composer?SolMgr=1' +
            '&serverUrl={!API.Partner_Server_URL_520}' +
            '&Id=' + recordIdvalue +
            '&TemplateId=' + this.templateId + '&DefaultPDF=1&DS7=1';
        window.open(print_doc_url);
    }
    printCongaDoc(event) {
        // this.showCongaSavePrintDialog=false;
        let recordIdvalue = this.recordId;
        if (this.templateId === '0T_010UAA954722') {
            //payment schedule repo order template is 0T_010UAA954722
            recordIdvalue = this.current_payment_schedule.Id;
        }
        let conga_url = '/apex/APXTConga4__Conga_Composer?SolMgr=1' +
            '&serverUrl={!API.Partner_Server_URL_520}' +
            '&Id=' + recordIdvalue +
            '&TemplateId=' + this.templateId + '&DefaultPDF=1&DS7=3&AC0=1';
        window.open(conga_url);
    }
    cancelCongaDialog(event) {
        this.showCongaSavePrintDialog = false;
    }
    showChargeOffAcctDialog = false;
    cancelChargeOffAcctDialog(event) {
        this.showChargeOffAcctDialog = false;
    }
    saveChargeOff(event) {
        this.showChargeOffAcctDialog = false;
        this.handleRepoSave();
    }
    readChargeOffDate(event) {
        this.repo_opportunity_obj.Charge_Off_Date__c = event.target.value;
    }
    readChargeOffReason(event) {
        this.repo_opportunity_obj.Charge_Off_Reason__c = event.target.value;
    }
    readReStockUnit(event) {
        this.repo_opportunity_obj.Restock_Unit__c = event.target.value;
    }
    readPreviousStock(event) {
        this.repo_opportunity_obj.Previous_Stock__c = event.target.value;
    }
    readCurrentMileage(event) {
        this.repo_opportunity_obj.Current_Mileage__c = event.target.value;
    }
    readNewStock(event) {
        this.repo_opportunity_obj.New_Stock__c = event.target.value;
    }
    readCurrentValue(event) {
        this.repo_opportunity_obj.Current_Value__c = event.target.value;
    }
    readChargeOffNote(event) {
        this.repo_opportunity_obj.Charge_Off_Note__c = event.target.value;
    }
   
    handleDeleteRecentPayment() {
        //console.log('strData' + JSON.stringify(this.repo_opportunity_obj));
        deleteRecentPaymentHandler({ opportunityId: this.recordId })
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                //  this.data = result;      
                this.error = undefined;
                //this.closeAction();
                const evt = new ShowToastEvent({
                    title: 'Success',
                    message: 'Recent Payment Deleted Successfully!',
                    variant: 'success',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                //this.closeAction();
                this.retrieveData();
                //window.open('/' + this.recordId, '_self');
                // this.show_spinner=false;
            })
            .catch(error => {
                this.error = error;
                let message = 'Unknown error';
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
                const evt = new ShowToastEvent({
                    title: 'ERROR',
                    message: message,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(evt);
                this.data = undefined;
                console.log('error setting default', error);
                this.show_spinner = false;
            });
    }
    payoffpopup_show=false;
    handlepayoffclick(event){
        //handle pay off click
        this.payoffpopup_show=true;
        this.payoffdate=null;
    }
    close_payoffpopup(){
        this.payoffpopup_show=false;        
    }

    latestPaidDate;
    @track
    payoffdate;
    payoff;
        
    readPayoffdate(event){
        try{
        this.payoffdate=event.target.value;
        var date1 = new Date(this.payoffdate);
        var date2 = this.latestPaidDate;

const yyyy1 = date1.getFullYear();
let mm1 = date1.getMonth() + 1; // Months start at 0!
let dd1 = date1.getDate();

if (dd1 < 10) dd1 = '0' + dd1;
if (mm1 < 10) mm1 = '0' + mm1;

const formatteddate1 = dd1 + '/' + mm1 + '/' + yyyy1;

date1=formatteddate1;
date1 = new Date(date1.split('/')[2],date1.split('/')[1]-1,date1.split('/')[0]);
date2 = new Date(date2.split('/')[2],date2.split('/')[0]-1,date2.split('/')[1]);

        console.log('date1:'+date1);
        console.log('date2:'+date2);
        //new Date(this.paymentscheduleObj.Start_Date__c);
        var Difference_In_Time = date1.getTime() - date2.getTime();
        // To calculate the no. of days between two dates
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
        console.log('Difference_In_Days:' + Difference_In_Days);
        this.payoff=(Difference_In_Days*this.data_obj.opportunityObj.Per_day_interest__c).toFixed(2);
        }catch(err){
            console.log(err.stack);
        }
    }

}