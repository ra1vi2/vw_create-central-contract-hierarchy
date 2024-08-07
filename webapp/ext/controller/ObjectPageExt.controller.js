sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/core/routing/HashChanger",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"vwks/nlp/s2p/mm/ctrhcentral/create/ext/util/Constants",
	"vwks/nlp/s2p/mm/ctrhcentral/create/ext/util/ControllerHelper",
	"vwks/nlp/s2p/mm/reuse/lib/util/NavigationHelper",
	"vwks/nlp/s2p/mm/reuse/lib/util/Constants"
], function (JSONModel, History, HashChanger, MessageBox, MessageToast, Constants, ControllerHelper, NavigationHelper, ReuseConstants) {
	"use strict";
	return sap.ui.controller("vwks.nlp.s2p.mm.ctrhcentral.create.ext.controller.ObjectPageExt", Object.assign({}, ControllerHelper, {

		/**
		 * Event handler for Object Page controller.
		 * Attach page data loaded event listener.
		 * @public
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this.getView().getController());
			oRouter.attachRoutePatternMatched(this.onPatternMatched.bind(this));

			this._createModel();
			this.extensionAPI.attachPageDataLoaded(this.onPageDataLoad.bind(this));
			this.extensionAPI.getTransactionController().attachAfterCancel(this._onCancel.bind(this));
			this.extensionAPI.getTransactionController().attachAfterSave(this._onSave.bind(this));
			this._oItemsTable = this.getView().byId(
				"vwks.nlp.s2p.mm.ctrhcentral.create::sap.suite.ui.generic.template.ObjectPage.view.Details::xVWKSxNLP_CCTR_C_CNTR_H_CREATE--Items::responsiveTable"
			);
			if (this._oItemsTable) {
				this._oItemsTable.attachEvent("selectionChange", this.onItemsTableSelectionChange.bind(this));
				this._oItemsTable.attachEvent("updateFinished", this.onItemsTableSelectionChange.bind(this));
			}
		},

		/**
		 * Utility function to get i18n resource bundle
		 * @return {object} i18n Resource bundle
		 * @public
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Pattern matched event handler.
		 * If navigation to this screen was done from 'c_CntrlPurContrHierHdrTP', move to MCPR app.
		 * @param {sap.ui.base.Event} oEvent The event object
		 * @public
		 */
		onPatternMatched: function (oEvent) {
			var oInstance = HashChanger.getInstance();

			if (oInstance.getCurrentNavigationState) {
				var sNewHash = oInstance.getCurrentNavigationState().newHash;
				// Check if the new hash is the listReport of the current app
				// In that case it should navigate to MPRC app
				if (!~sNewHash.indexOf(Constants.CCTR_C_CNTR_H_CREATE_ENTITY_NAME)) {
					//Navigate to MPRC
					NavigationHelper.navigateToOutboundTarget(this, "MPRC");
				}
			}
		},

		/**
		 * Once data is loaded, switch to edit mode.
		 * Fire visibility of target fields based on Contract Type data.
		 * @public
		 */
		onPageDataLoad: function () {
			this.getUIModel().setProperty("/editable", true);
			this._listenEvents();
			var sDefaultContractType = this.getView().getBindingContext().getObject("Contract_Type");
			this._setTargetFieldsVisibility(sDefaultContractType);
		},

		/**
		 * Navigate to external app (MCPC).
		 * @param {object} oData data responce, it includes new contract hierarchy guid
		 * @param {object} oResponse response data object
		 */
		successCreateHCTR: function (oData, oResponse) {

			var vHctrno = oData.ContractDraftUUID;
			//CentralPurchaseContract parameter is different than what is passed in standard app
			var sRequiredURL = this.getView().getModel("MCPC").createKey("C_CntrlPurContrHierHdrTP", {
				CentralPurchaseContract: Constants.DRAFT_CONTRACT_NUMBER,
				DraftUUID: vHctrno,
				IsActiveEntity: false
			});

			//Navigate to MCPC
			NavigationHelper.navigateToExternalApp(this, "MCPC", sRequiredURL);

			this.oView.setBusy(false);
			this._detachEvents();
		},

		/**
		 * Apply changes to create Central Contract Hierarchy.
		 * @param {object} oError error object data
		 */
		errorCreateCCTR: function (oError) {
			var sMessage = JSON.parse(oError.responseText).error.message.value;
			this._handleError(sMessage);
			this.oView.setBusy(false);
		},

		/**
		 * Show success message and navigate back.
		 */
		successDeleteHCTR: function () {
			MessageToast.show(this.getResourceBundle().getText("SuccessDeleteHCTRMsg"));
			this._navigateBack();
		},

		/**
		 * Handle error if request is failed.
		 */
		errorDeleteHCTR: function () {
			this._handleError(this.getResourceBundle().getText("ErrorDeleteHCTRMsg"));
		},

		/**
		 * Contract Type selection change event handler.
		 * It hides or shows field based on the selected value.
		 * @param {sap.ui.base.Event} oEvent change event
		 * @public
		 */
		onContractTypeChange: function (oEvent) {
			var sNewValue = oEvent.getParameter("newValue");
			this._setTargetFieldsVisibility(sNewValue);
		},

		/**
		 * Show error message box and keep edit mode.
		 * @param {string} sMessage error message text
		 */
		_handleError: function (sMessage) {
			MessageBox.error(sMessage);
			// Switch to edit mode
			this.getUIModel().setProperty("/editable", true);
		},

		/**
		 * This method is fired, once save action is done.
		 * It calls 'CreateCentralContractHier' FI and does cross-app navigation.
		 * @param {sap.ui.base.Event} oEvent The event  object
		 * @private
		 */
		_onSave: function (oEvent) {
			oEvent.saveEntityPromise
				.then(function () {
					var oPayload = {
						HeaderKey: this.getView().getBindingContext().getObject("Guid")
					};
					this.oView.setBusy(true);
					this.getODataModel().callFunction("/CreateCentralContractHier", {
						method: "POST",
						urlParameters: oPayload,
						success: this.successCreateHCTR.bind(this),
						error: this.errorCreateCCTR.bind(this)
					});
				}.bind(this));
		},

		/**
		 * Fire method to navigate back.
		 * @private
		 */
		_onCancel: function () {
			var sPath = this.getView().getModel().createKey("/xVWKSxNLP_CCTR_C_CNTR_H_CREATE", {
				Guid: this.getView().getBindingContext().getObject("Guid")
			});
			this.getODataModel().remove(sPath, {
				success: this.successDeleteHCTR.bind(this),
				error: this.errorDeleteHCTR.bind(this)
			});
		},

		/**
		 * Create view model.
		 * It manages visibility of the fields.
		 * @private
		 */
		_createModel: function () {
			this._oCTRHSettingsModel = new JSONModel({
				showTargetValueField: true,
				showTargetQuantityField: true
			});
			this.getView().setModel(this._oCTRHSettingsModel, "ctrHSettingsModel");
		},

		/**
		 * Get id of contract type field
		 * @return {sap.ui.core.Control} ui5 control
		 * @public
		 */
		getContractTypeField: function () {
			return this.getControlByBaseId("GeneralInformation::Contract_Type::Field");
		},

		/**
		 * Attach event listeners.
		 * @private
		 */
		_listenEvents: function () {
			var oContractTypeControl = this.getContractTypeField();
			oContractTypeControl.attachEvent("change", this.onContractTypeChange, this);
		},

		/**
		 * Detach event listeners.
		 * @private
		 */
		_detachEvents: function () {
			var oContractTypeControl = this.getContractTypeField();
			oContractTypeControl.detachEvent("change", this.onContractTypeChange, this);
		},

		/**
		 * Navigate back if changes are canceled.
		 */
		_navigateBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash) {
				this._detachEvents();
				window.history.go(-1);
			}
		},

		/**
		 * Show or hide target fields.
		 * @param {string} sValue selected item value
		 * @private 
		 */
		_setTargetFieldsVisibility: function (sValue) {
			if (sValue === ReuseConstants.CONTRACT_TYPE.QUANTITY) {
				// Target Quantity item is selected
				this._oCTRHSettingsModel.setProperty("/showTargetValueField", false);
				this._oCTRHSettingsModel.setProperty("/showTargetQuantityField", true);
			} else if (sValue === ReuseConstants.CONTRACT_TYPE.VALUE) {
				// Target Amount item is selected
				this._oCTRHSettingsModel.setProperty("/showTargetValueField", true);
				this._oCTRHSettingsModel.setProperty("/showTargetQuantityField", false);
			} else {
				this._oCTRHSettingsModel.setProperty("/showTargetValueField", true);
				this._oCTRHSettingsModel.setProperty("/showTargetQuantityField", true);
			}
		},
		/**
		 * handler for Creating the dialog
		 * @param {sap.ui.base.Event} oEvent The event object
		 */
		onHandleMassChangeDialog: function (oEvent) {
			if (!this._oMassChangeDialog) {
				this.sIdMassChangeDialog = this.createId("MassChangeDialog");
				// Save the instance of dialog to avoid batch call on each load
				this._oMassChangeDialog = sap.ui.xmlfragment(this.sIdMassChangeDialog,
					"vwks.nlp.s2p.mm.ctrhcentral.create.ext.fragments.MassChangeDialog", this);
				this.getView().addDependent(this._oMassChangeDialog);
				// local model for mass change field name and value
				var oMassChangeModel = new JSONModel({
					selectedFieldName: "",
					selectedFieldValue: ""
				});
				this._oMassChangeDialog.setModel(oMassChangeModel, "massChange");
			}
			this._oMassChangeDialog.open();
		},
		/**
		 * handler method for Mass change Apply
		 * @param {sap.ui.base.Event} oEvent The event object
		 */
		onHandleApplyMassChange: function (oEvent) {
			var aSelectedItems = this._oItemsTable.getSelectedItems();
			if (aSelectedItems.length) {
				var oMassChangeModel = this._oMassChangeDialog.getModel("massChange");
				var sMassChangeField = oMassChangeModel.getProperty("/selectedFieldName");
				var sMassChangeInputValue = oMassChangeModel.getProperty("/selectedFieldValue");
				var oMassChangeTableRow = {
					FieldName: sMassChangeField,
					FieldValue: sMassChangeInputValue
				};
				var i;
				this.oModel = this.getOwnerComponent().getModel();
				for (i = 0; i < aSelectedItems.length; i++) { //Looping through the table for items data
					if (aSelectedItems[i].getBindingContext()) { //checking if the item contains a 
						//binding context.
						var oItem = aSelectedItems[i].getBindingContext().getObject(); //get the item data from 
						oMassChangeTableRow.ItemKey = oItem.Guid;
						// function import call for mass update change
						this.oModel.callFunction("/MassChangeContractItems", {
							method: "POST",
							urlParameters: oMassChangeTableRow,
							success: this.successMassChangeRows.bind(this),
							error: this.errorMassChangeRows.bind(this)
						});

					}
				}
				// Clear the Dropdown key and Input Box values 
				oMassChangeModel.setProperty("/selectedFieldName", "");
				oMassChangeModel.setProperty("/selectedFieldValue", "");
			}

			this._oMassChangeDialog.close();
		},
		/**
		 * Success handler for Mass change function import.
		 * @param {object} oResponse response data object
		 */
		successMassChangeRows: function (oResponse) {
			// Refresh the Items bindings with updated values 
			if (this._oItemsTable.getBinding("items")) {
				this._oItemsTable.getBinding("items").refresh();
			}
		},
		/**
		 * Error handler for Mass change function import.
		 * @param {object} oResponse response data object
		 */
		errorMassChangeRows: function (oResponse) {
			try {
				MessageBox.error(JSON.parse(oResponse.responseText).error.message.value);
			} catch (e) {
				MessageBox.error(this.getResourceBundle().getText("MassChangeError"));
			}
		},
		/**
		 * handle Mass Change Dialog close event
		 * @public
		 */
		onHandleCloseMassChangeDialog: function () {
			//Close dialog
			this._oMassChangeDialog.destroy();
			this._oMassChangeDialog = "";
		},
		/*
		 * This method enables/disables Change Item button based on selected Rows for mass change
		 */
		onItemsTableSelectionChange: function () {
			var oChangeItemsBtn = this.getView().byId("MassChangeBtn");
			var aSelectedItems = this._oItemsTable.getSelectedItems();
			if (aSelectedItems.length) {
				oChangeItemsBtn.setEnabled(true);
			} else {
				oChangeItemsBtn.setEnabled(false);
			}

		}
	}));
});