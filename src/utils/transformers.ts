export function formatName(name: string) {
	const lowercaseWords = ['da', 'de', 'do', 'dos', 'das', 'e', 'é'];
	const words = name.toLowerCase().split(' ');
	const formattedName = words.map((word) => {
		return lowercaseWords.includes(word) ? word : capitalize(word);
	});

	return formattedName.join(' ');
}

function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}