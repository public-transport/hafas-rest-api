import {strictEqual} from 'node:assert'

// snap `when` to 10s steps for a better cache hit ratio
// Note: With most HAFAs instances, this will yield slightly different results because it all it will return results <=10s in the past.
const snapWhenTo10sSteps = (t = Date.now(), snapForward = false) => {
	t -= t % (10 * 1000)
	if (snapForward) t += 10 * 1000
	return t
}

strictEqual(snapWhenTo10sSteps(Date.parse('2024-01-29T16:10:50.000+01:00')), Date.parse('2024-01-29T16:10:50+01:00'))
strictEqual(snapWhenTo10sSteps(Date.parse('2024-01-29T16:10:57.812+01:00')), Date.parse('2024-01-29T16:10:50+01:00'))
strictEqual(snapWhenTo10sSteps(Date.parse('2024-01-29T16:11:00.000+01:00')), Date.parse('2024-01-29T16:11:00+01:00'))
strictEqual(snapWhenTo10sSteps(Date.parse('2024-01-29T16:10:57.812+01:00'), true), Date.parse('2024-01-29T16:11:00+01:00'))

export {
	snapWhenTo10sSteps as snapWhenToSteps,
}