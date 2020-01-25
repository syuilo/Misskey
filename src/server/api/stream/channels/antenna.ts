import autobind from 'autobind-decorator';
import Channel from '../channel';
import { Notes } from '../../../../models';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import { PackedNote } from '../../../../models/repositories/note';

export default class extends Channel {
	public readonly chName = 'antenna';
	public static shouldShare = false;
	public static requireCredential = false;
	private antennaId: string;

	@autobind
	public async init(params: any) {
		this.antennaId = params.antennaId as string;

		// Subscribe stream
		this.subscriber.on(`antennaStream:${this.antennaId}`, this.onEvent);
	}

	@autobind
	private async onEvent(key: string, value: any) {
		if (key === 'note') {
			const note = await Notes.pack(value, this.user, { detail: true });

			// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
			if (shouldMuteThisNote(note, this.muting)) return;

			this.send('note', note);
		} else {
			this.send(key, value);
		}
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`antennaStream:${this.antennaId}`, this.onEvent);
	}
}
