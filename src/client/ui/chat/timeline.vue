<template>
<XNotes ref="tl" :pagination="pagination" @queue="$emit('queue', $event)" v-follow="pagination.reversed"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from './notes.vue';
import * as os from '@/os';
import * as sound from '@/scripts/sound';
import { scrollToBottom } from '@/scripts/scroll';
import follow from '@/directives/follow-append';

export default defineComponent({
	components: {
		XNotes
	},

	directives: {
		follow
	},
	
	provide() {
		return {
			inChannel: this.src === 'channel'
		};
	},

	props: {
		src: {
			type: String,
			required: true
		},
		list: {
			type: String,
			required: false
		},
		antenna: {
			type: String,
			required: false
		},
		channel: {
			type: String,
			required: false
		},
		sound: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	emits: ['note', 'queue', 'before', 'after'],

	data() {
		return {
			connection: null,
			connection2: null,
			pagination: null,
			baseQuery: {
				includeMyRenotes: this.$store.state.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.showLocalRenotes
			},
			query: {},
		};
	},

	created() {
		const prepend = note => {
			(this.$refs.tl as any).prepend(note);

			this.$emit('note');

			if (this.sound) {
				sound.play(note.userId === this.$i.id ? 'noteMy' : 'note');
			}
		};

		const onUserAdded = () => {
			(this.$refs.tl as any).reload();
		};

		const onUserRemoved = () => {
			(this.$refs.tl as any).reload();
		};

		const onChangeFollowing = () => {
			if (!this.$refs.tl.backed) {
				this.$refs.tl.reload();
			}
		};

		let endpoint;
		let reversed = false;

		if (this.src == 'antenna') {
			endpoint = 'antennas/notes';
			this.query = {
				antennaId: this.antenna
			};
			this.connection = os.stream.connectToChannel('antenna', {
				antennaId: this.antenna
			});
			this.connection.on('note', prepend);
		} else if (this.src == 'home') {
			endpoint = 'notes/timeline';
			this.connection = os.stream.useSharedConnection('homeTimeline');
			this.connection.on('note', prepend);

			this.connection2 = os.stream.useSharedConnection('main');
			this.connection2.on('follow', onChangeFollowing);
			this.connection2.on('unfollow', onChangeFollowing);
		} else if (this.src == 'local') {
			endpoint = 'notes/local-timeline';
			this.connection = os.stream.useSharedConnection('localTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'social') {
			endpoint = 'notes/hybrid-timeline';
			this.connection = os.stream.useSharedConnection('hybridTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'global') {
			endpoint = 'notes/global-timeline';
			this.connection = os.stream.useSharedConnection('globalTimeline');
			this.connection.on('note', prepend);
		} else if (this.src == 'mentions') {
			endpoint = 'notes/mentions';
			this.connection = os.stream.useSharedConnection('main');
			this.connection.on('mention', prepend);
		} else if (this.src == 'directs') {
			endpoint = 'notes/mentions';
			this.query = {
				visibility: 'specified'
			};
			const onNote = note => {
				if (note.visibility == 'specified') {
					prepend(note);
				}
			};
			this.connection = os.stream.useSharedConnection('main');
			this.connection.on('mention', onNote);
		} else if (this.src == 'list') {
			endpoint = 'notes/user-list-timeline';
			this.query = {
				listId: this.list
			};
			this.connection = os.stream.connectToChannel('userList', {
				listId: this.list
			});
			this.connection.on('note', prepend);
			this.connection.on('userAdded', onUserAdded);
			this.connection.on('userRemoved', onUserRemoved);
		} else if (this.src == 'channel') {
			endpoint = 'channels/timeline';
			reversed = true;
			this.query = {
				channelId: this.channel
			};
			this.connection = os.stream.connectToChannel('channel', {
				channelId: this.channel
			});
			this.connection.on('note', prepend);
		}

		this.pagination = {
			endpoint: endpoint,
			reversed,
			limit: 10,
			params: init => ({
				untilDate: init ? undefined : (this.date ? this.date.getTime() : undefined),
				...this.baseQuery, ...this.query
			})
		};
	},

	mounted() {

	},

	beforeUnmount() {
		this.connection.dispose();
		if (this.connection2) this.connection2.dispose();
	},

	methods: {
		focus() {
			this.$refs.tl.focus();
		},
	}
});
</script>