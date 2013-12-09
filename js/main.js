(function() {
	var Schroderify = {};

	Schroderify._remoteDbs = {};
	Schroderify.pullRemoteDb = function (dbName) {
		var deffered = jQuery.Deferred();

		if (Schroderify._remoteDbs[dbName]) {
			setTimeout(function () {
				deffered.resolve(Schroderify._remoteDbs[dbName]);
			}, 0);
			return deffered;
		}

		$.ajax({
			url: 'db/'+dbName+'.json',
			dataType: 'json'
		}).done(function (data) {
			Schroderify._remoteDbs[dbName] = data;

			deffered.resolve(data);
		}).fail(function (jqXHR, textStatus, errorThrown) {
			deffered.reject(errorThrown);
		});

		return deffered;
	};

	Schroderify.pullLocalDb = function (dbName) {
		if (!window.localStorage) {
			return null;
		}

		var localDbName = 'db.'+dbName;

		var json = localStorage.getItem(localDbName);

		if (!json) {
			return null;
		}

		return $.parseJSON(json);
	};

	Schroderify.pullDb = function (dbName) {
		var deffered = jQuery.Deferred();

		var localDb = Schroderify.pullLocalDb(dbName);

		Schroderify.pullRemoteDb(dbName).done(function (data) {
			if (localDb) {
				data = $.extend(true, {}, data, localDb);
			}

			deffered.resolve(data);
		}).fail(function (jqXHR, textStatus, errorThrown) {
			if (localDb) {
				deffered.resolve(localDb);
			} else {
				deffered.reject(errorThrown);
			}
		});

		return deffered;
	};

	Schroderify.pushLocalDb = function (dbName, data) {};

	window.Schroderify = Schroderify; //Export API
})();