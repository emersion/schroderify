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
	var verbs, declinations, score, config = {
		questions: 0,
		chronometer: false
	};

	var $startCtn = $('#start'),
		$startBtn = $startCtn.find('.start a'),
		$customizeBtn = $startCtn.find('.customize a'),
		$loadingCtn = $('#loading'),
		$questionCtn = $('#question'),
		$endCtn = $('#end'),
		$scoreCtn = $('#score'),
		$chronoCtn = $('#chronometer'),
		$answerActionsCtn = $questionCtn.find('.answer-actions'),
		$nextBtn = $answerActionsCtn.find('.next a'),
		$stopBtn = $answerActionsCtn.find('.stop a'),
		$restartBtn = $endCtn.find('.restart a'),
		$customizeCtn = $('#customize-modal');

	var formatTime = function (duration) {
		var time = new Date(duration);

		var durMinutes = time.getMinutes(),
			durSeconds = time.getSeconds(),
			durMs = time.getMilliseconds();

		var humanDur = '';
		if (durMinutes) {
			humanDur += ' '+durMinutes+'min';
		}
		if (durSeconds) {
			humanDur += ' '+durSeconds+'s';
		}
		if (durMs) {
			humanDur += ' '+durMs+'ms';
		}

		return humanDur;
	};

	var firstStart = true;
	var showStart = function () {
		score = {
			answers: { good: 0, bad: 0, total: 0 },
			answersTime: [],
			startTime: 0,
			endTime: 0,
			result: 0
		};

		if (firstStart) {
			$startCtn.show();
			$loadingCtn.hide();
			$questionCtn.hide();
			$endCtn.hide();
			$scoreCtn.hide();
			$chronoCtn.hide();
		} else {
			$startCtn.slideDown();
			$endCtn.slideUp();
			$scoreCtn.slideUp();
		}

		firstStart = false;
	};

	var setConfig = function () {
		var $questionsNbr = $startCtn.find('.cfg-questions-nbr'),
			$chrono = $startCtn.find('.cfg-chrono');

		config.questions = Math.abs(parseInt($questionsNbr.val())) || 0;
		config.chronometer = $chrono.find('.chrono-on').is('.active');
	};

	var chronoIntervalId = null;
	var startChronometer = function () {
		if (!score.startTime) {
			score.startTime = (new Date()).getTime();
		}

		if (chronoIntervalId !== null) { //Already started
			return;
		}

		if (score.endTime > 0) {
			score.startTime += (new Date()).getTime() - score.endTime;
		}

		if (config.chronometer) {
			var $chrono = $chronoCtn.find('.chronometer-inner');

			var updateChrono = function () {
				var duration = (new Date()).getTime() - score.startTime;
				var durationSeconds = Math.round(duration / 1000);

				if (!durationSeconds) {
					return;
				}

				$chrono.html(formatTime(durationSeconds * 1000));
			};

			chronoIntervalId = setInterval(function () {
				updateChrono();
			}, 1000);
			updateChrono();
		}
	};
	var stopChronometer = function () {
		score.endTime = (new Date()).getTime();

		if (!chronoIntervalId) { //Not started
			return;
		}

		if (config.chronometer) {
			clearInterval(chronoIntervalId);
			chronoIntervalId = null;
		}
	};

	var startQuestions = function () {
		$startCtn.slideUp();
		setConfig();

		$loadingCtn.slideDown();

		Schroderify.pullDb('verbs').done(function(data) {
			verbs = data.verbs;
			declinations = data.declinations;

			$questionCtn.slideDown();

			if (config.chronometer) {
				$chronoCtn.slideDown();
			}

			nextQuestion();
		}).fail(function(msg) {
			alert('Sausage Potatoe Digital error ('+msg+')');
		}).always(function () {
			$loadingCtn.slideUp();
		});
	};

	var showSuccessAnimation = function (centerPos) {
		var $successCircle = $('<div></div>').addClass('question-success');

		for (var i = 0; i < 0; i++) {
			(function () {
				var $circle = $successCircle.clone();

				var before = {
					dim: $(window).width() / 10,
					pos: {}
				}, after = {
					dim: $(window).width(),
					pos: {}
				};

				after.pos.x = centerPos.x - after.dim / 2;
				after.pos.y = centerPos.y - after.dim / 2;
				before.pos.x = after.pos.x + after.dim / 2 - before.dim / 2;
				before.pos.y = after.pos.y + after.dim / 2 - before.dim / 2;

				$circle.css({
					'z-index': '-1',
					'position': 'absolute',
					'width': before.dim+'px',
					'height': before.dim+'px',
					'left': before.pos.x+'px',
					'top': before.pos.y+'px',
					'border-radius': '100%',
					'background-color': 'rgb(71, 164, 71)'
				}).prependTo('body').animate({
					'opacity': 0,
					'width': after.dim+'px',
					'height': after.dim+'px',
					'left': after.pos.x+'px',
					'top': after.pos.y+'px'
				}, 'normal', function() {
					$(this).remove();
				});
			})();
		}
	};

	var remainingVerbs = null;
	var nextQuestion = function () {
		if (remainingVerbs === null) {
			remainingVerbs = $.extend({}, verbs);
		}

		if (Object.keys(remainingVerbs).length == 0 || (config.questions && config.questions <= score.answers.total)) {
			showEnd();
			return;
		}

		var randomIndex = Math.round(Math.random() * (Object.keys(remainingVerbs).length - 1)),
			randomVerb = Object.keys(remainingVerbs)[randomIndex],
			randomVerbData = verbs[randomVerb],
			randomVerbMeaning = randomVerbData.meaning.fr_FR;

		delete remainingVerbs[randomVerb];

		var verbDecl = declinations[randomVerbData.declination];

		var otherDecls = {};
		for (var declName in declinations) {
			var declPattern = declinations[declName];
			if (declPattern[0] == verbDecl[0]) {
				otherDecls[declName] = declPattern;
			}
		}

		var $questionVerb = $questionCtn.find('h2 .question-inner'),
			$answerComment = $questionCtn.find('h2 .answer-comment'),
			$declCtn = $questionCtn.find('.answers-container');

		startChronometer();

		var answerStartTime = (new Date()).getTime();
		var updateScore = function () {
			score.answersTime.push((new Date()).getTime() - answerStartTime);

			var $goodProgress = $scoreCtn.find('.progress-bar-success'),
				$badProgress = $scoreCtn.find('.progress-bar-danger');

			var goodPercentage = score.answers.good / score.answers.total * 100,
				badPercentage = score.answers.bad / score.answers.total * 100;

			$goodProgress.width(goodPercentage + '%');
			$badProgress.width(badPercentage + '%');

			$goodProgress.find('.sr-only').html(Math.round(goodPercentage) + '% ('+score.answers.good+' r&eacute;ussites)');
			$badProgress.find('.sr-only').html(Math.round(badPercentage) + '% ('+score.answers.bad+' &eacute;checs)');

			if ($scoreCtn.is(':hidden')) {
				$scoreCtn.slideDown();
			}
		};

		var showAnswerComment = function (isGood) {
			$answerComment.removeClass('text-success text-danger');

			var comments = {
				good: ['Good!','Well done!','Right!','Yeah!'],
				bad: ['Bad!','Das ist schlecht!','Wrong!','Ouch...']
			};

			if (isGood) {
				$answerComment.addClass('text-success');
			} else {
				$answerComment.addClass('text-danger');
			}

			var thisAnswerComments = comments[(isGood) ? 'good' : 'bad'];
			var comment = thisAnswerComments[Math.round(Math.random() * (thisAnswerComments.length - 1))];
			$answerComment.html(comment);

			$answerComment.css({
				opacity: 1
			}).animate({
				opacity: 0
			}, 'slow');
		};

		var showAnswer = function () {
			stopChronometer();

			$answerActionsCtn.show();

			$declCtn.children().off('click').addClass('btn-default').removeClass('btn-primary');
			$declCtn.children('.answer').addClass('btn-success');
			$declCtn.children('.clicked:not(.answer)').addClass('btn-danger');

			var isGood = ($declCtn.children('.clicked.answer').length > 0);
			if (isGood) {
				score.answers.good++;
				showSuccessAnimation({ x: 100, y: 140 });
			} else {
				score.answers.bad++;
			}
			score.answers.total++;
			updateScore();
			showAnswerComment(isGood);
		};

		var paradoxalStar = (randomVerbData.type == 'paradoxal') ? '<span class="tooltip-container" data-toggle="tooltip" data-placement="bottom" title="This is a paradoxal verb. Irregular because its root changes, regular because it takes regular declinations.">*</span>' : '';
		$questionVerb.html(randomVerb+(paradoxalStar || '')+' <small>('+randomVerbMeaning+')</small>').find('.tooltip-container').tooltip();
		$answerActionsCtn.hide();

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

	var showEnd = function () {
		var duration = score.endTime - score.startTime;
		$endCtn.find('.score-time').find('.score-time-inner').html(formatTime(duration));

		var timeSum = score.answersTime.reduce(function(a, b) { return a + b; });
		score.answersTimeAvg = timeSum / score.answersTime.length;

		score.result = (1/Math.sqrt(duration)*Math.sqrt(score.answers.good) + score.answers.good*10)*1000;

		$endCtn.find('.score-result').html(Math.round(score.result));

		$questionCtn.slideUp();
		$chronoCtn.slideUp();
		$endCtn.slideDown();

		$scoreCtn.find('.progress-bar .sr-only').removeClass('sr-only');
	};

	var customizeDbLoaded = false;
	var showCustomizeVerbs = function () {
		var $loadingCtn = $customizeCtn.find('.loading-ctn'),
			$customizeTable = $customizeCtn.find('table'),
			$customizeTbody = $customizeTable.find('tbody');

		if (customizeDbLoaded) {
			return;
		}

		var verbsHandlers = {};
		var addToVerbsList = function (data) {
			var $declList = $('<select></select>');
			for (var declName in data.declinations) {
				$declList.append('<option name="'+declName+'">'+data.declinations[declName].join(', ')+'</option>');
			}

			for (var verbName in data.verbs) {
				(function(verbName, verbData) {
					var $row = $('<tr></tr>');

					var $enableCheckbox = $('<input />', { type: 'checkbox', checked: 'checked' });
					$('<td></td>').append($enableCheckbox).appendTo($row);

					$row.append('<td>'+verbName+'</td>');

					var $verbDeclList = $declList.clone();
					$verbDeclList.find('option[name="'+verbData.declination+'"]').attr('selected','selected');
					$('<td></td>').append($verbDeclList).appendTo($row);

					var $meaning = $('<input />', { type: 'text', value: verbData.meaning.fr_FR });
					$('<td></td>').append($meaning).appendTo($row);

					verbsHandlers[verbName] = function () {
						var verbNewData = {};

						if (!$enableCheckbox.is(':checked')) {
							verbNewData.disabled = true;
						}

						if ($verbDeclList.val() != verbData.declination) {
							verbNewData.declination = $verbDeclList.val();
						}

						if ($meaning.val() != verbData.meaning.fr_FR) {
							verbNewData.meaning = { fr_FR: $meaning.val() };
						}

						return verbNewData;
					};

					$row.appendTo($customizeTbody);
				})(verbName, data.verbs[verbName]);
			}
		};
		var showVerbsList = function (data) {
			$customizeTbody.empty();
			addToVerbsList(data);
		};

		$customizeTable.hide();

		Schroderify.pullRemoteDb('verbs').done(function (remoteData) {
			$customizeTable.show();
			customizeDbLoaded = true;

			showVerbsList(remoteData);
		}).fail(function (msg) {
			alert('Sausage Potatoe Digital error ('+msg+')');
		}).always(function () {
			$loadingCtn.slideUp();
		});
	};
	var saveCustomizeVerbs = function () {};

	$startBtn.click(function (e) {
		startQuestions();
		e.preventDefault();
	});

	$customizeBtn.click(function (e) {
		showCustomizeVerbs();
		e.preventDefault();
	});

	$nextBtn.click(function (e) {
		nextQuestion();
		e.preventDefault();
	});

	$stopBtn.click(function (e) {
		showEnd();
		e.preventDefault();
	});

	$restartBtn.click(function (e) {
		showStart();
		e.preventDefault();
	});

	showStart();
});