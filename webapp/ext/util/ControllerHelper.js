sap.ui.define([
], function () {
	"use strict";

	return {
		/**
		 * Return control by Id.
		 * @param {string} sControlId control id
		 * @return {sap.ui.core.Control} ui5 control
		 */
		getControlByBaseId: function (sControlId) {
			var sControlBaseId = this.createId(sControlId);
			return this.byId(sControlBaseId);
		},

		/**
		 * Return "ui" model.
		 * @return {sap.ui.core.Control} ui5 control
		 */
		getUIModel: function () {
			return this.getView().getModel("ui");
		},

		/**
		 * Return OData model.
		 * @return {sap.ui.model.odata.v2.ODataModel} OData model
		 */
		getODataModel: function () {
			return this.getView().getModel();
		}
	};
});