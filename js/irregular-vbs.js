/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

$(function() {
	var verbs, declinations;

	var $startCtn = $('#start'),
		$questionCtn = $('#question'),
		$endCtn = $('#end'),
		$nextBtn = $questionCtn.find('.next a');

	var showStart = function () {
		$startCtn.show();
		$questionCtn.hide();
		$endCtn.hide();
	};

	var startQuestions = function () {
		$startCtn.hide();

		$.ajax({
			url: 'db/verbs.json',
			dataType: 'json'
		}).done(function(data) {
			verbs = data.verbs;
			declinations = data.declinations;

			$questionCtn.show();

			nextQuestion();
		}).fail(function() {
			alert('Sausage error.');
		});
	};

	var remainingVerbs = null;
	var nextQuestion = function () {
		if (remainingVerbs === null) {
			remainingVerbs = $.extend({}, verbs);
		}

		if (Object.keys(remainingVerbs).length == 0) {
			showEnd();
			return;
		}

		var randomIndex = Math.round(Math.random() * (Object.keys(remainingVerbs).length - 1)),
			randomVerb = Object.keys(remainingVerbs)[randomIndex],
			randomVerbData = verbs[randomVerb];

		delete remainingVerbs[randomVerb];

		var verbDecl = declinations[randomVerbData.declination];

		var otherDecls = {};
		for (var declName in declinations) {
			var declPattern = declinations[declName];
			if (declPattern[0] == verbDecl[0]) {
				otherDecls[declName] = declPattern;
			}
		}

		var $questionVerb = $questionCtn.find('h2'),
			$declCtn = $questionCtn.find('.declinations');

		var showAnswer = function () {
			$nextBtn.show();

			$declCtn.children().off('click').addClass('btn-default').removeClass('btn-primary');
			$declCtn.children('.answer').addClass('btn-success');
			$declCtn.children('.clicked:not(.answer)').addClass('btn-danger');
		};

		$questionCtn.find('h2').html(randomVerb);
		$nextBtn.hide();

		$declCtn.empty();
		var declNames = Object.keys(otherDecls);
		declNames = shuffleArray(declNames);
		for (var i = 0; i < declNames.length; i++) {
			var declName = declNames[i];
			(function(declName, declPattern) {
				var $decl = $('<label></label>').addClass('btn btn-primary');
				$decl.append('<input type="radio"> '+declPattern.join(', '));

				$decl.click(function() {
					$decl.addClass('clicked');
					showAnswer();
				});

				if (randomVerbData.declination == declName) {
					$decl.addClass('answer');
				}

				$declCtn.append($decl);
			})(declName, declinations[declName]);
		}
	};

	var showEnd = function() {
		$questionCtn.hide();
		$endCtn.show();
	};

	$startCtn.find('a').click(function (e) {
		startQuestions();
		e.preventDefault();
	});

	$nextBtn.click(function (e) {
		nextQuestion();
		e.preventDefault();
	});

	showStart();
});