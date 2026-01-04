package com.agibuild.audixa.smb;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import com.hierynomus.msdtyp.AccessMask;
import com.hierynomus.msfscc.FileAttributes;
import com.hierynomus.msfscc.fileinformation.FileIdBothDirectoryInformation;
import com.hierynomus.protocol.commons.EnumWithValue;
import com.hierynomus.mssmb2.SMB2CreateDisposition;
import com.hierynomus.mssmb2.SMB2CreateOptions;
import com.hierynomus.mssmb2.SMB2ShareAccess;
import com.hierynomus.smbj.SMBClient;
import com.hierynomus.smbj.auth.AuthenticationContext;
import com.hierynomus.smbj.connection.Connection;
import com.hierynomus.smbj.session.Session;
import com.hierynomus.smbj.share.DiskShare;
import com.hierynomus.smbj.share.File;

public final class SmbjBridge {
    private static final AtomicLong NEXT_ID = new AtomicLong(1);
    private static final ConcurrentHashMap<Long, Handle> HANDLES = new ConcurrentHashMap<>();

    public SmbjBridge() {
    }

    public long openFile(
            String host,
            String share,
            String path,
            String domain,
            String username,
            String password) {
        try {
            SMBClient client = new SMBClient();
            Connection connection = client.connect(host);

            String d = domain == null ? "" : domain;
            String u = username == null ? "" : username;
            String p = password == null ? "" : password;
            AuthenticationContext auth = new AuthenticationContext(u, p.toCharArray(), d);
            Session session = connection.authenticate(auth);

            DiskShare diskShare = (DiskShare) session.connectShare(share);

            File file = diskShare.openFile(
                    path,
                    EnumSet.of(AccessMask.GENERIC_READ),
                    EnumSet.of(FileAttributes.FILE_ATTRIBUTE_NORMAL),
                    EnumSet.of(SMB2ShareAccess.FILE_SHARE_READ),
                    SMB2CreateDisposition.FILE_OPEN,
                    EnumSet.noneOf(SMB2CreateOptions.class));

            long size = file.getFileInformation().getStandardInformation().getEndOfFile();

            long id = NEXT_ID.getAndIncrement();
            HANDLES.put(id, new Handle(client, connection, session, diskShare, file, size));
            return id;
        } catch (Exception ex) {
            throw new RuntimeException("SMB openFile failed: " + ex.getMessage(), ex);
        }
    }

    public int read(long handleId, long offset, byte[] buffer, int bufferOffset, int length) {
        Handle h = HANDLES.get(handleId);
        if (h == null) {
            return -1;
        }
        try {
            if (offset >= h.size) {
                return -1;
            }
            return h.file.read(buffer, offset, bufferOffset, length);
        } catch (Exception ex) {
            throw new RuntimeException("SMB read failed: " + ex.getMessage(), ex);
        }
    }

    public long length(long handleId) {
        Handle h = HANDLES.get(handleId);
        return h == null ? -1 : h.size;
    }

    public void close(long handleId) {
        Handle h = HANDLES.remove(handleId);
        if (h == null) {
            return;
        }
        try { h.file.close(); } catch (Exception ignored) { }
        try { h.diskShare.close(); } catch (Exception ignored) { }
        try { h.session.close(); } catch (Exception ignored) { }
        try { h.connection.close(); } catch (Exception ignored) { }
        try { h.client.close(); } catch (Exception ignored) { }
    }

    public String[] listDirectory(
            String host,
            String share,
            String path,
            String domain,
            String username,
            String password) {
        SMBClient client = null;
        Connection connection = null;
        Session session = null;
        DiskShare diskShare = null;

        try {
            client = new SMBClient();
            connection = client.connect(host);
            String d = domain == null ? "" : domain;
            String u = username == null ? "" : username;
            String p = password == null ? "" : password;
            AuthenticationContext auth = new AuthenticationContext(u, p.toCharArray(), d);
            session = connection.authenticate(auth);
            diskShare = (DiskShare) session.connectShare(share);

            ArrayList<String> items = new ArrayList<>();
            for (FileIdBothDirectoryInformation info : diskShare.list(path)) {
                String name = info.getFileName();
                // Skip current/parent.
                if (".".equals(name) || "..".equals(name)) {
                    continue;
                }
                boolean isDir = EnumWithValue.EnumUtils.isSet(info.getFileAttributes(), FileAttributes.FILE_ATTRIBUTE_DIRECTORY);
                items.add((isDir ? "D" : "F") + "\t" + name);
            }
            return items.toArray(new String[0]);
        } catch (Exception ex) {
            throw new RuntimeException("SMB listDirectory failed: " + ex.getMessage(), ex);
        } finally {
            try { if (diskShare != null) diskShare.close(); } catch (Exception ignored) { }
            try { if (session != null) session.close(); } catch (Exception ignored) { }
            try { if (connection != null) connection.close(); } catch (Exception ignored) { }
            try { if (client != null) client.close(); } catch (Exception ignored) { }
        }
    }

    public String[] listDirectoryPage(
            String host,
            String share,
            String path,
            String domain,
            String username,
            String password,
            int offset,
            int limit) {
        SMBClient client = null;
        Connection connection = null;
        Session session = null;
        DiskShare diskShare = null;

        try {
            client = new SMBClient();
            connection = client.connect(host);
            String d = domain == null ? "" : domain;
            String u = username == null ? "" : username;
            String p = password == null ? "" : password;
            AuthenticationContext auth = new AuthenticationContext(u, p.toCharArray(), d);
            session = connection.authenticate(auth);
            diskShare = (DiskShare) session.connectShare(share);

            int safeOffset = Math.max(0, offset);
            int safeLimit = Math.max(0, limit);

            // Collect at most (limit + 1) items so caller can determine if there is a next page.
            ArrayList<String> items = new ArrayList<>();
            int idx = 0;

            for (FileIdBothDirectoryInformation info : diskShare.list(path)) {
                String name = info.getFileName();
                if (".".equals(name) || "..".equals(name)) {
                    continue;
                }

                if (idx++ < safeOffset) {
                    continue;
                }

                if (items.size() >= safeLimit + 1) {
                    break;
                }

                boolean isDir = EnumWithValue.EnumUtils.isSet(info.getFileAttributes(), FileAttributes.FILE_ATTRIBUTE_DIRECTORY);
                items.add((isDir ? "D" : "F") + "\t" + name);
            }

            return items.toArray(new String[0]);
        } catch (Exception ex) {
            throw new RuntimeException("SMB listDirectoryPage failed: " + ex.getMessage(), ex);
        } finally {
            try { if (diskShare != null) diskShare.close(); } catch (Exception ignored) { }
            try { if (session != null) session.close(); } catch (Exception ignored) { }
            try { if (connection != null) connection.close(); } catch (Exception ignored) { }
            try { if (client != null) client.close(); } catch (Exception ignored) { }
        }
    }

    private static final class Handle {
        final SMBClient client;
        final Connection connection;
        final Session session;
        final DiskShare diskShare;
        final File file;
        final long size;

        Handle(SMBClient client, Connection connection, Session session, DiskShare diskShare, File file, long size) {
            this.client = client;
            this.connection = connection;
            this.session = session;
            this.diskShare = diskShare;
            this.file = file;
            this.size = size;
        }
    }
}


