import * as Minio from 'minio';
import DriveFile, { DriveFileChunk, IDriveFile } from '../../models/drive-file';
import DriveFileThumbnail, { DriveFileThumbnailChunk } from '../../models/drive-file-thumbnail';
import config from '../../config';
import driveChart from '../../chart/drive';
import perUserDriveChart from '../../chart/per-user-drive';
import DriveFileOriginal, { DriveFileOriginalChunk } from '../../models/drive-file-original';

export default async function(file: IDriveFile, isExpired = false) {
	if (file.metadata.storage == 'minio') {
		const minio = new Minio.Client(config.drive.config);

		// 後方互換性のため、file.metadata.storageProps.key があるかどうかチェックしています。
		// 将来的には const obj = file.metadata.storageProps.key; とします。
		const obj = file.metadata.storageProps.key ? file.metadata.storageProps.key : `${config.drive.prefix}/${file.metadata.storageProps.id}`;
		await minio.removeObject(config.drive.bucket, obj);

		if (file.metadata.thumbnailUrl) {
			// 後方互換性のため、file.metadata.storageProps.thumbnailKey があるかどうかチェックしています。
			// 将来的には const thumbnailObj = file.metadata.storageProps.thumbnailKey; とします。
			const thumbnailObj = file.metadata.storageProps.thumbnailKey ? file.metadata.storageProps.thumbnailKey : `${config.drive.prefix}/${file.metadata.storageProps.id}-thumbnail`;
			await minio.removeObject(config.drive.bucket, thumbnailObj);
		}

		if (file.metadata.originalUrl) {
			const originalObj = file.metadata.storageProps.originalKey ? file.metadata.storageProps.originalKey : `${config.drive.prefix}/${file.metadata.storageProps.id}-original`;
			await minio.removeObject(config.drive.bucket, originalObj);
		}
	}

	// チャンクをすべて削除
	await DriveFileChunk.remove({
		files_id: file._id
	});

	await DriveFile.update({ _id: file._id }, {
		$set: {
			'metadata.deletedAt': new Date(),
			'metadata.isExpired': isExpired
		}
	});

	//#region サムネイルもあれば削除
	const thumbnail = await DriveFileThumbnail.findOne({
		'metadata.originalId': file._id
	});

	if (thumbnail) {
		await DriveFileThumbnailChunk.remove({
			files_id: thumbnail._id
		});

		await DriveFileThumbnail.remove({ _id: thumbnail._id });
	}
	//#endregion

	const original = await DriveFileOriginal.findOne({
		'metadata.originalId': file._id
	});

	if (original) {
		await DriveFileOriginalChunk.remove({
			files_id: original._id
		});

		await DriveFileOriginal.remove({ _id: original._id });
	}

	// 統計を更新
	driveChart.update(file, false);
	perUserDriveChart.update(file, false);
}
