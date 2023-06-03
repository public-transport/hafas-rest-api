// snap `when` to 10s steps for a better cache hit ratio
// Note: With most HAFAs instances, this will yield slightly different results because it all it will return results <=10s in the past.
const snapWhenTo10sSteps = () => {
	const now = Date.now()
	return now - now % 10 * 1000
}

export {
	snapWhenTo10sSteps as snapWhenToSteps,
}