import Mute from '../../../../models/mute';
import { pack } from '../../../../models/note';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';

export default class extends Channel {
	private mutedUserIds: string[] = [];

	public init = async (params: any) => {
		// Subscribe events
		this.subscriber.on('hybridTimeline', this.onNewNote);
		this.subscriber.on(`hybridTimeline:${this.user._id}`, this.onNewNote);

		const mute = await Mute.find({ muterId: this.user._id });
		this.mutedUserIds = mute.map(m => m.muteeId.toString());
	}

	private onNewNote = async (note: any) => {
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await pack(note.renoteId, this.user, {
				detail: true
			});
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, this.mutedUserIds)) return;

		this.send('note', note);
	}

	public dispose = () => {
		// Unsubscribe events
		this.subscriber.off('hybridTimeline', this.onNewNote);
		this.subscriber.off(`hybridTimeline:${this.user._id}`, this.onNewNote);
	}
}
