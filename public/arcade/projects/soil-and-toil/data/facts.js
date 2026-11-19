/* ALL on-screen text lives here. Source tags: [truth] = Truth Sheet, [demo] = illustrative simulation formula. */
window.FACTS={
slug:'soil-and-toil',
badge:'SIMULATION · demo model, not the real trained model',
simBadge:'SIMULATION · illustrative',
scenes:[
{h:"DAD'S FIELD",c:'Lab tests are slow and costly.',t:'My family farms',note:'My family farms. I wanted soil health checks a farmer can do in a minute. This began with my father\'s field.'},
{h:'THREE NUMBERS',c:'A photo becomes 61 colours.',t:'Last part is estimated',note:'MST++ rebuilds a 61-band curve from red, green and blue. The infrared part is an estimate. Hold the prism to block the light.'},
{h:'CLEAN SIGNAL',c:'188 features become 30.',t:'Smooth, scale, squeeze',note:'Smoothing, SNV and derivatives remove noise. PCA keeps 30 numbers.'},
{h:'TWO MODELS',c:'Fifty passes show doubt.',t:'Ensemble with a 95% band',note:'Fifty dropout passes show how sure the model is. The mix is 0.45 PLSR and 0.55 CNN.'},
{h:'PH FIRST',c:'Wrong pH locks nutrients.',t:'Plants show it',note:'At the wrong pH, nutrients are locked in the soil. That is why pH runs before NPK.'},
{h:'YOUR LANGUAGE',c:'EN, HI, KN advice.',t:'Maths first, words last',note:'A language model only phrases the result. The maths is deterministic.'},
{h:'REALITY',c:'Built for a real farm.',t:'A solo project',note:'I built this alone for my father\'s farmland.'}
],
real:{REAL:['Full pipeline code','Async job API','32 saved runs','Advice in three languages','Fallbacks if parts fail'],
PARTIAL:['Near-infrared bands are extrapolated','pH and soil models: synthetic tiles','MST++ weights not trained on soil','Some training spectra matched by neighbours']},
noteHand:'built solo, for my father\'s farm',
advice:{EN:'Your soil needs more nitrogen. Add urea before sowing. Check again in four weeks.',
HI:'आपकी मिट्टी में नाइट्रोजन कम है। बुवाई से पहले यूरिया डालें। चार हफ्ते बाद फिर जाँच करें।',
KN:'ನಿಮ್ಮ ಮಣ್ಣಿನಲ್ಲಿ ಸಾರಜನಕ ಕಡಿಮೆ ಇದೆ. ಬಿತ್ತನೆಗೆ ಮೊದಲು ಯೂರಿಯಾ ಹಾಕಿ. ನಾಲ್ಕು ವಾರಗಳ ನಂತರ ಮತ್ತೆ ಪರೀಕ್ಷಿಸಿ.'},
swatches:[{n:'Dark clay',hue:.1,dark:.8,moist:.4},{n:'Red laterite',hue:.02,dark:.45,moist:.15},{n:'Sandy',hue:.15,dark:.15,moist:.05},{n:'Loamy',hue:.08,dark:.6,moist:.3}],
/* [demo] spectrum formula: v(i)=(0.62-0.5*dark)*(0.55+0.45*x)+0.05*sin(hue*6.28+i/8)-moist*0.2*x-moist*0.07*exp(-((i-55)/3)^2), x=i/60, i=0..60 (400 to 1000 nm). Demo N,P,K,pH are read off this curve. Not real predictions. */
mix:{plsr:.45,cnn:.55,passes:50,bands:61,estFrom:30,feat:188,pca:30},
tips:{'NPK':'Nitrogen, Phosphorus, Potassium: the three main plant nutrients.','pH':'How acidic or alkaline soil is, from 3.5 to 9.0.','MST++':'Multi-stage Spectral-wise Transformer: turns an RGB photo into 31 bands.','PLSR':'Partial Least Squares Regression: a steady, classic spectrum model.','PCA':'Principal Component Analysis: keeps the few numbers that matter most.','SNV':'Standard Normal Variate: rescales each spectrum to remove brightness effects.','1D-CNN':'One-dimensional neural network that reads a spectrum like a signal.','MC Dropout':'Monte Carlo Dropout: random switch-offs repeated to measure doubt.','ensemble':'Several models blended into one answer.','OSSL':'Open Soil Spectral Library: public reference soil spectra.','Redis':'A fast store that holds job progress for one hour.','HTTP 202':'Server reply meaning: accepted, still working.','LLM':'Large language model: it only phrases the advice.','95% band':'Confidence interval: the range likely to hold the true value.','Savitzky-Golay':'A smoothing filter that keeps the curve shape.'}
};
