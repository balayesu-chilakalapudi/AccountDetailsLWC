# AccountDetailsLWC

The code below call apex method with some parameters, based on the apex method response the below javascript code shows the success/error message to the user.


```
retrieveData() {
        getData({ opportunityId: this.recordId, sort_direction: this.sort_direction, fromdate: this.fromdate_filter, todate: this.todate_filter })
            .then(result => {
                console.log('result:' + JSON.stringify(result));
                this.data_obj = result;               
                this.error = undefined;
                const evt = new ShowToastEvent({
                        title: 'Success',
                        message: 'Data Retrival Successful!',
                        variant: 'success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);
            })
            .catch(error => {
                this.error = error;
                this.data_obj = undefined;
                console.log('error setting default', error);
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
                console.log('message:'+message);
            });
    }
```

To run the code successful, we need to import two statements like this,

```
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getData from "@salesforce/apex/account_details_lwc_controller.getAccountDetails";
```
