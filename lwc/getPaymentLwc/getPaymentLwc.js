import { LightningElement, api, track } from 'lwc';
import modal from "@salesforce/resourceUrl/custommodal";
import { NavigationMixin } from 'lightning/navigation';
import { CloseActionScreenEvent } from "lightning/actions";
import { loadStyle } from "lightning/platformResourceLoader";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getData from "@salesforce/apex/getPaymentLwcController.getAccountDetails";
import savePayment from "@salesforce/apex/getPaymentLwcController.savePaymentHistory";


export default class GetPaymentLwc extends LightningElement {
    @api recordId;
    @track data_obj = [];
    @track paymentHistoryList = [];
    @track sort_direction = 'DESC';

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
            this.retrieveData();
        }
    }


    closeAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }
    payment_schedule_picklist_options = [];
    payment_schedule_picklist_value = 'Select';
    account_status = '';
    current_payment_schedule;
    retrieveData() {
        getData({ opportunityId: this.recordId})
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.data_obj = result;
                this.handleTakePaymentClick();
                this.paymentHistoryList = this.data_obj.paymentHistoryList;
                //populate payment schedule picklist
                if (this.data_obj.opportunityObj.Payment_Schedules__r != null) {
                    for (let x of this.data_obj.opportunityObj.Payment_Schedules__r) {
                        this.payment_schedule_picklist_options.push({ label: x.Month_Name__c, value: x.Id });
                    }
                }
                this.payment_schedule_picklist_value = this.data_obj.current_payment_schedule.Id;
                this.current_payment_schedule = this.data_obj.current_payment_schedule;
                console.log('current_payment_schedule:' + JSON.stringify(this.current_payment_schedule));
                this.handlePaymentScheduleChange(null);
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.data_obj = undefined;
                console.log('error setting default', error);
            });
    }
    @track paymentscheduleObj = {};
    @track paymentHistoryModal = {};

    handleTakePaymentClick(event) {
        //  this.payment_schedule_picklist_value=null;
        this.paymentHistoryModal = {};
        // this.paymentscheduleObj={};
        this.isShowTakePaymentModal = true;
    }
    isShowTakePaymentModal=false;
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
                            if (this.latest_paid_date < x.Effective_Date__c &&
                                x.Payment_Schedule__c == this.paymentscheduleObj.Id) {
                                this.latest_paid_date = x.Effective_Date__c;
                            }
                        }                        
                    }
                    if (this.latest_paid_date != null) {
                        date2value = this.latest_paid_date;
                    }
                    var date1 = new Date(this.paymentHistoryModal.Effective_Date__c);
                    var date2 = new Date(date2value);
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
            this.isShowTakePaymentModal = false;
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
                   // this.retrieveData();
                     this.closeAction();
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
}