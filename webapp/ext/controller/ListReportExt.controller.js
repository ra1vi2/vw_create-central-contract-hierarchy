sap.ui.controller("vwks.nlp.s2p.mm.ctrhcentral.create.ext.controller.ListReportExt", {
	/**
	 * Event handler for ListReport Page controller.
	 * Attach route pattern matched event listener.
	 * @public
	 */
	onInit: function () {
		var oRouter = sap.ui.core.UIComponent.getRouterFor(this.getView().getController());
		oRouter.attachRoutePatternMatched(this.onPatternMatched.bind(this));
	},

	/**
	 * Route pattern matched event handler.
	 * Navigate to MPRC app.
	 * @public
	 */
	onPatternMatched: function () {
		//for navigation back to source app instead of list report of current application
		/* eslint-disable */
		window.history.go(-1);
		/* eslint-enable */
	}
});